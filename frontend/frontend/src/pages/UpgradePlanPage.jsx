import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Button from "@/components/ui/Button";
import PlanCard from "../components/common/PlanCard";
import CompanyPlanAPI from "../features/companies/CompanyPlanAPI";
import PaymentAPI from "../features/companies/PaymentAPI";
import CompanyAPI from "../features/companies/CompanyAPI";
export default function UpgradePlanPage() {
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const [plans, setPlans] = useState([]);
    const [currentSummary, setCurrentSummary] = useState(null);

    // PlanCard cần nhưng recruiter không dùng menu admin
    const [openMenuId, setOpenMenuId] = useState(null);
    const [company, setCompany] = useState(null);
    const [checkingCompany, setCheckingCompany] = useState(true);

    const currentPlanId = currentSummary?.current_plan?.id
        ? String(currentSummary.current_plan.id)
        : null;
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                setCheckingCompany(true);
                const res = await CompanyAPI.getMyCompany();
                setCompany(res.data?.data ?? null);
            } catch (e) {
                setCompany(null);
            } finally {
                setCheckingCompany(false);
            }
        };

        fetchCompany();
    }, []);


    const fetchData = async () => {
        try {
            setErrMsg("");
            setLoading(true);

            const [optRes, sumRes] = await Promise.all([
                CompanyPlanAPI.getUpgradeOptions(),
                CompanyPlanAPI.getCurrentSummary(),
            ]);

            const optData = optRes?.data?.data ?? optRes?.data ?? [];
            setPlans(Array.isArray(optData) ? optData : []);
            setCurrentSummary(sumRes?.data?.data ?? null);
        } catch (err) {
            console.error("❌ Load upgrade options failed:", err);
            setErrMsg("Không thể tải danh sách gói. Vui lòng thử lại.");
        } finally {
            setTimeout(() => setLoading(false), 200);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sortedPlans = useMemo(() => {
        const clone = [...(plans || [])];
        clone.sort((a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0));
        return clone;
    }, [plans]);

    const handleChoosePlan = async (plan) => {
        // chỉ xử lý khi can_buy true (nút sẽ bị disable nếu false)
        const ok = await Swal.fire({
            title: `Nâng cấp lên "${plan?.name}"?`,
            text: "Bạn sẽ được chuyển sang trang thanh toán.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Tiếp tục",
            cancelButtonText: "Huỷ",
            confirmButtonColor: "#2563eb",
        });

        if (!ok.isConfirmed) return;
        console.log("Selected plan:", plan);
        try {
            const res = await PaymentAPI.createVnpayPayment({
                plan_id: String(plan?.id),
                locale: "vn",
            });

            const paymentUrl = res?.data?.data?.payment_url;
            if (!paymentUrl) throw new Error("Missing payment_url");

            // ✅ Redirect sang VNPAY
            window.location.href = paymentUrl;
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: "error",
                title: "Không thể tạo thanh toán",
                text: "Vui lòng thử lại sau.",
            });
        }
    };
    if (checkingCompany) {
        return (
            <div className="p-8 text-center text-slate-500">
                Đang kiểm tra thông tin công ty...
            </div>
        );
    }
    if (!company) {
        return (
            <div className="p-12 text-center text-slate-600">
                <p className="font-semibold text-lg mb-2">
                    Bạn chưa tạo hồ sơ công ty
                </p>
                <p className="text-sm text-slate-500">
                    Vui lòng tạo hồ sơ công ty trước khi nâng cấp gói dịch vụ.
                </p>
                <Button onClick={() => window.location.href = "/recruiter/company"}>
                    Tạo hồ sơ công ty
                </Button>
            </div>
        );
    }
    if (company.status !== "approved") {
        return (
            <div className="p-12 text-center text-amber-600">
                <p className="font-semibold text-lg mb-2">
                    Hồ sơ công ty đang chờ duyệt
                </p>
                <p className="text-sm text-slate-500">
                    Sau khi admin phê duyệt, bạn có thể nâng cấp gói dịch vụ.
                </p>
            </div>
        );
    }


    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Nâng cấp gói dịch vụ
                    </h1>

                    {currentSummary?.current_plan ? (
                        <p className="text-slate-500 mt-1">
                            Gói hiện tại:{" "}
                            <span className="font-semibold text-slate-700">
                                {currentSummary.current_plan.name}
                            </span>
                        </p>
                    ) : (
                        <p className="text-slate-500 mt-1">
                            Bạn chưa đăng ký gói nào — hãy chọn gói phù hợp để bắt đầu.
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[520px] animate-pulse"
                        />
                    ))}
                </div>
            ) : errMsg ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-rose-300">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        ⚠️
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{errMsg}</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-6">
                        Kiểm tra token / quyền recruiter hoặc backend.
                    </p>
                    <Button onClick={fetchData} variant="outline" size="sm">
                        Thử lại
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPlans.map((p) => {
                        const currentPrice = Number(currentSummary?.current_plan?.price);
                        const planPrice = Number(p?.price);

                        const isCurrent =
                            Number.isFinite(currentPrice) &&
                            Number.isFinite(planPrice) &&
                            planPrice === currentPrice;


                        // Backend đã trả can_buy đúng logic upgrade (true nếu plan cao hơn)
                        const canBuy = !!p?.can_buy;

                        let chooseDisabled = false;
                        let chooseLabel = "Nâng cấp";

                        if (isCurrent) {
                            chooseDisabled = true;
                            chooseLabel = "Kế hoạch hiện tại";
                        } else if (!canBuy) {
                            chooseDisabled = true;
                            chooseLabel = "Không thể nâng cấp";
                        }


                        return (
                            <PlanCard
                                key={String(p.id)}
                                plan={p}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                                onChoosePlan={handleChoosePlan}
                                chooseLabel={chooseLabel}
                                chooseDisabled={chooseDisabled}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
