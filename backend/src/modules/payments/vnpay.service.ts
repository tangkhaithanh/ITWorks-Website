import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type VnpParams = Record<string, string>;

function pad2(n: number) {
    return n.toString().padStart(2, '0');
}

function formatVnpDateGMT7(d: Date) {
    // đảm bảo GMT+7 dù server chạy timezone nào
    const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
    const gmt7 = new Date(utc + 7 * 60 * 60_000);

    return (
        gmt7.getFullYear().toString() +
        pad2(gmt7.getMonth() + 1) +
        pad2(gmt7.getDate()) +
        pad2(gmt7.getHours()) +
        pad2(gmt7.getMinutes()) +
        pad2(gmt7.getSeconds())
    );
}

function normalizeOrderInfo(s: string) {
    // VNPAY khuyến nghị tiếng Việt không dấu, không ký tự đặc biệt
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 _\-:.]/g, '')
        .trim()
        .slice(0, 255);
}

function buildQueryStringForSign(params: VnpParams) {
    const keys = Object.keys(params).sort();
    return keys
        .map((k) => {
            const v = params[k] ?? '';
            // giống logic urlencode/qs encode=false thường dùng trong doc demo
            const encV = encodeURIComponent(v).replace(/%20/g, '+');
            const encK = encodeURIComponent(k);
            return `${encK}=${encV}`;
        })
        .join('&');
}

@Injectable()
export class VnpayService {
    private tmnCode: string;
    private hashSecret: string;
    private vnpUrl: string;
    private returnUrl: string;

    constructor(private config: ConfigService) {
        this.tmnCode = this.config.get<string>('VNPAY_TMN_CODE') ?? '';
        this.hashSecret = this.config.get<string>('VNPAY_HASH_SECRET') ?? '';
        this.vnpUrl =
            this.config.get<string>('VNPAY_URL') ??
            'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.returnUrl = this.config.get<string>('VNPAY_RETURN_URL') ?? '';

        if (!this.tmnCode || !this.hashSecret || !this.returnUrl) {
            throw new Error('Missing VNPAY config (TMN_CODE, HASH_SECRET, RETURN_URL).');
        }
    }

    createPaymentUrl(input: {
        txnRef: string;
        amountVnd: bigint; // VND
        ipAddr: string;
        orderInfo: string;
        locale?: 'vn' | 'en';
        bankCode?: string;
        expireMinutes?: number;
    }) {
        const now = new Date();
        const createDate = formatVnpDateGMT7(now);
        const expireDate = formatVnpDateGMT7(
            new Date(now.getTime() + (input.expireMinutes ?? 15) * 60_000),
        );

        const amount = (input.amountVnd * 100n).toString(); // VNPAY yêu cầu *100 :contentReference[oaicite:6]{index=6}

        const vnpParams: VnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: amount,
            vnp_CurrCode: 'VND',
            vnp_TxnRef: input.txnRef,
            vnp_OrderInfo: normalizeOrderInfo(input.orderInfo),
            vnp_OrderType: 'other',
            vnp_Locale: input.locale ?? 'vn',
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: input.ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };

        if (input.bankCode) vnpParams.vnp_BankCode = input.bankCode;

        // Sign (v2.1.0 không cần gửi vnp_SecureHashType) :contentReference[oaicite:7]{index=7}
        const signData = buildQueryStringForSign(vnpParams);
        const secureHash = crypto
            .createHmac('sha512', this.hashSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        const url = `${this.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
        return { url, expireDate };
    }

    verifyCallback(query: Record<string, any>) {
        const vnpSecureHash = String(query.vnp_SecureHash ?? '');
        if (!vnpSecureHash) throw new BadRequestException('Missing vnp_SecureHash');

        // lấy tất cả vnp_*
        const vnpParams: VnpParams = {};
        for (const [k, v] of Object.entries(query)) {
            if (!k.startsWith('vnp_')) continue;
            if (k === 'vnp_SecureHash' || k === 'vnp_SecureHashType') continue;
            vnpParams[k] = Array.isArray(v) ? String(v[0]) : String(v ?? '');
        }

        const signData = buildQueryStringForSign(vnpParams);
        const expected = crypto
            .createHmac('sha512', this.hashSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        if (expected !== vnpSecureHash) {
            throw new BadRequestException('Invalid signature');
        }

        return vnpParams;
    }
}
