import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PaymentAPI from "../features/companies/PaymentAPI";

export default function PaymentResultPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const run = async () => {
            const orderId = params.get("order_id");
            const statusParam = params.get("status"); // 'paid' | 'failed'

            if (!orderId) {
                navigate("/recruiter/dashboard", { replace: true });
                return;
            }

            try {
                // ✅ verify lại order trên server (khỏi tin query param 100%)
                const res = await PaymentAPI.getOrder(orderId);
                const status = res?.data?.status || statusParam;

                if (status === "paid") {
                    await Swal.fire({
                        icon: "success",
                        title: "Thanh toán thành công!",
                        timer: 1200,
                        showConfirmButton: false,
                    });
                    navigate("/recruiter/dashboard", { replace: true });
                } else {
                    await Swal.fire({
                        icon: "error",
                        title: "Thanh toán thất bại",
                        text: "Giao dịch không thành công hoặc đã hết hạn.",
                    });
                    navigate("/recruiter/upgrade-plan", { replace: true });
                }
            } catch (e) {
                console.error(e);
                // fallback theo query param
                if (statusParam === "paid") navigate("/recruiter/dashboard", { replace: true });
                else navigate("/recruiter/upgrade-plan", { replace: true });
            }
        };

        run();
    }, [navigate, params]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center text-slate-600">
            Đang xử lý kết quả thanh toán...
        </div>
    );
}
