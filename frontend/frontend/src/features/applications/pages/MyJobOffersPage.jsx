import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import DOMPurify from "dompurify";
import Swal from "sweetalert2";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldAlert,
  Wallet,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import JobOfferAPI from "@/features/applications/JobOfferAPI";

const statusMeta = {
  pending: {
    label: "Đang chờ",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  accepted: {
    label: "Đã chấp nhận",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  expired: {
    label: "Hết hạn",
    icon: AlertCircle,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  withdrawn: {
    label: "Đã thu hồi",
    icon: ShieldAlert,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

const getStatusMeta = (status) => {
  const key = String(status || "").toLowerCase();
  return (
    statusMeta[key] || {
      label: status || "Không rõ",
      icon: AlertCircle,
      className: "bg-slate-50 text-slate-700 border-slate-200",
    }
  );
};

const formatSalary = (salary, currency) => {
  if (salary == null && (currency == null || currency === "")) {
    return "Thỏa thuận";
  }

  const numericSalary = Number(salary);
  const normalizedCurrency = currency ? String(currency).toUpperCase() : "";

  const formattedSalary =
    salary == null || salary === ""
      ? "--"
      : Number.isFinite(numericSalary)
        ? new Intl.NumberFormat("vi-VN").format(numericSalary)
        : salary;

  return [formattedSalary, normalizedCurrency].filter(Boolean).join(" ");
};

const formatDateTime = (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--");

const formatTextValue = (value) => {
  if (!value) return "--";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const hasMeaningfulHtmlContent = (html) => {
  if (typeof html !== "string") return false;
  const sanitized = DOMPurify.sanitize(html);
  const parsed = new DOMParser().parseFromString(sanitized, "text/html");
  return Boolean(parsed.body.textContent?.replace(/\u00a0/g, " ").trim());
};

const getCompanyInitial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

const getLogoFallback = (companyName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    companyName || "Company",
  )}&background=e0f2fe&color=0369a1&bold=true`;

const getResponseMessage = (response, fallback) =>
  response?.data?.data?.message || response?.data?.message || fallback;

const getErrorMessage = (error) =>
  error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";

const LoadingList = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse"
      >
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-lg bg-slate-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="h-8 w-36 rounded-lg bg-slate-100" />
              <div className="h-8 w-28 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const { label, icon: StatusIcon, className } = getStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      <StatusIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const JobOfferCard = ({ offer, onClick }) => {
  const companyName = offer.company?.name || "Công ty";
  const jobTitle = offer.job?.title || "Vị trí tuyển dụng";
  const salaryText = formatSalary(offer.salary, offer.currency);
  const fallbackLogo = useMemo(() => getLogoFallback(companyName), [companyName]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className="cursor-pointer bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 p-2 shrink-0 flex items-center justify-center overflow-hidden">
            {offer.company?.logo_url ? (
              <img
                src={offer.company.logo_url}
                alt={`${companyName} logo`}
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.src = fallbackLogo;
                }}
              />
            ) : (
              <span className="text-xl font-bold text-blue-700">
                {getCompanyInitial(companyName)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-snug text-slate-900">
                  {jobTitle}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{companyName}</span>
                </div>
              </div>
              <StatusBadge status={offer.status} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <Wallet className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="font-semibold">{salaryText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function MyJobOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offerDetailModal, setOfferDetailModal] = useState({
    open: false,
    offer: null,
    loading: false,
    error: "",
  });
  const [offerActionLoading, setOfferActionLoading] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await JobOfferAPI.getMyOffers();
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      setOffers(items);
    } catch (err) {
      console.error("Không thể tải danh sách job offers:", err);
      setError("Không thể tải danh sách thư mời nhận việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const closeOfferDetailModal = () => {
    setOfferDetailModal({
      open: false,
      offer: null,
      loading: false,
      error: "",
    });
  };

  const handleOpenOfferDetail = async (offer) => {
    setOfferDetailModal({
      open: true,
      offer: null,
      loading: true,
      error: "",
    });

    try {
      if (!offer?.id) {
        throw new Error("Missing offer id");
      }

      const res = await JobOfferAPI.getMyOfferById(offer.id);
      const payload = res.data?.data ?? res.data;

      setOfferDetailModal({
        open: true,
        offer: payload,
        loading: false,
        error: "",
      });
    } catch (err) {
      console.error("KhÃ´ng thá»ƒ táº£i chi tiáº¿t job offer:", err);
      setOfferDetailModal({
        open: true,
        offer: null,
        loading: false,
        error: "KhÃ´ng thá»ƒ táº£i chi tiáº¿t thÆ° má»i nháº­n viá»‡c. Vui lÃ²ng thá»­ láº¡i.",
      });
    }
  };

  const handleOfferAction = async (action) => {
    if (!currentOffer?.id || offerActionLoading) return;

    const isAcceptAction = action === "accept";
    const confirm = await Swal.fire({
      text: isAcceptAction
        ? "Bạn có chắc chắn chấp nhận offer này?"
        : "Bạn có chắc chắn từ chối offer này?",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Hủy",
      confirmButtonText: "Ok",
      confirmButtonColor: isAcceptAction ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!confirm.isConfirmed) return;

    try {
      setOfferActionLoading(true);
      const res = isAcceptAction
        ? await JobOfferAPI.accept(currentOffer.id)
        : await JobOfferAPI.reject(currentOffer.id);
      const message = getResponseMessage(
        res,
        isAcceptAction
          ? "Bạn đã chấp nhận offer thành công."
          : "Bạn đã từ chối offer thành công.",
      );

      await Swal.fire({
        text: message,
        icon: "success",
        confirmButtonText: "Ok",
      });

      closeOfferDetailModal();
      await fetchOffers();
    } catch (err) {
      console.error("Không thể cập nhật trạng thái job offer:", err);
      Swal.fire("Lỗi", getErrorMessage(err), "error");
    } finally {
      setOfferActionLoading(false);
    }
  };

  const currentOffer = offerDetailModal.offer;
  const isPendingOffer = currentOffer?.status === "pending";
  const companyName = currentOffer?.company?.name || "CÃ´ng ty";
  const jobTitle = currentOffer?.job?.title || "Vá»‹ trÃ­ tuyá»ƒn dá»¥ng";
  const fallbackLogo = useMemo(() => getLogoFallback(companyName), [companyName]);
  const sanitizedMessage =
    typeof currentOffer?.message === "string"
      ? DOMPurify.sanitize(currentOffer.message)
      : "";
  const hasMessage = hasMeaningfulHtmlContent(sanitizedMessage);
  const detailItems = currentOffer
    ? [
        {
          label: "Salary",
          value: formatSalary(currentOffer.salary, currentOffer.currency),
          icon: Wallet,
        },
        {
          label: "Employment type",
          value: formatTextValue(currentOffer.employment_type),
          icon: BriefcaseBusiness,
        },
        {
          label: "Expires at",
          value: formatDateTime(currentOffer.expires_at),
          icon: CalendarClock,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Thư mời nhận việc
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi các offer mà nhà tuyển dụng đã gửi đến bạn.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchOffers}
            disabled={loading}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {loading && <LoadingList />}

        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
            <p className="mt-3 text-sm font-medium text-rose-700">{error}</p>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={fetchOffers}
            >
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && offers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BriefcaseBusiness className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Chưa có thư mời nhận việc
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Khi nhà tuyển dụng gửi offer, bạn sẽ thấy thông tin tại đây.
            </p>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="space-y-4">
            {offers.map((offer, index) => (
              <JobOfferCard
                key={offer.id ?? `${offer.company_id ?? "company"}-${offer.job_id ?? "job"}-${index}`}
                offer={offer}
                onClick={() => handleOpenOfferDetail(offer)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={offerDetailModal.open}
        onClose={closeOfferDetailModal}
        title="Chi tiết thư mời"
        width="max-w-3xl mx-4"
      >
        <div className="max-h-[78vh] overflow-y-auto pr-1">
          {offerDetailModal.loading && (
            <div className="flex min-h-72 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {!offerDetailModal.loading && offerDetailModal.error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
              <p className="mt-3 text-sm font-medium text-rose-700">
                {offerDetailModal.error}
              </p>
            </div>
          )}

          {!offerDetailModal.loading && !offerDetailModal.error && currentOffer && (
            <div className="space-y-6 text-[15px] text-slate-700">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white p-2 shadow-sm">
                    {currentOffer.company?.logo_url ? (
                      <img
                        src={currentOffer.company.logo_url}
                        alt={`${companyName} logo`}
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.src = fallbackLogo;
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-700">
                        {getCompanyInitial(companyName)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                      {companyName}
                    </p>
                    <h3 className="mt-1 break-words text-2xl font-bold text-slate-900">
                      {jobTitle}
                    </h3>
                    <div className="mt-3">
                      <StatusBadge status={currentOffer.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {detailItems.map((item) => {
                  const DetailIcon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                        <DetailIcon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Nội dung thư mời
                </p>
                {hasMessage ? (
                  <div
                    className="prose prose-slate prose-sm max-w-none rounded-xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm prose-p:my-3 prose-p:leading-7 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-slate-900 prose-a:text-blue-600 break-words [&_*]:max-w-full [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Chưa có nội dung thư mời.
                  </div>
                )}
              </div>

              {isPendingOffer && (
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="!border-rose-600 !bg-rose-600 !text-white hover:!border-rose-700 hover:!bg-rose-700 focus:!ring-rose-300"
                    onClick={() => handleOfferAction("reject")}
                    disabled={offerActionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="green"
                    onClick={() => handleOfferAction("accept")}
                    disabled={offerActionLoading}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
