import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import PlanAPI from "../PlantAPI";
import Swal from "sweetalert2";
import PlanFormModal from "../components/PlanFormModal";
import PlanCard from "../../../components/common/PlanCard";

export default function ManagePlanPage() {
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const [openMenuId, setOpenMenuId] = useState(null);

    const [openPlanModal, setOpenPlanModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    const fetchPlans = async () => {
        try {
            setErrMsg("");
            setLoading(true);
            const res = await PlanAPI.getAllAdmin();
            const data = res?.data?.data ?? res?.data ?? [];
            setPlans(Array.isArray(data) ? data : []);
        } catch (err) {
            setErrMsg("Không thể tải danh sách plan. Vui lòng thử lại.");
        } finally {
            setTimeout(() => setLoading(false), 250);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const sortedPlans = useMemo(() => {
        const clone = [...plans];
        clone.sort((a, b) => Number(a?.price ?? 0) - Number(b?.price ?? 0));
        return clone;
    }, [plans]);

    const handleCreatePlan = () => {
        setModalMode("create");
        setSelectedPlanId(null);
        setOpenPlanModal(true);
    };

    const handleEditPlan = (id) => {
        setModalMode("edit");
        setSelectedPlanId(id);
        setOpenPlanModal(true);
        setOpenMenuId(null);
    };

    const confirmAction = async (options, action) => {
        const result = await Swal.fire(options);
        if (!result.isConfirmed) return;
        await action();
        await fetchPlans();
    };

    const handleHidePlan = (id) =>
        confirmAction(
            {
                title: "Ẩn plan này?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ẩn plan",
                confirmButtonColor: "#dc2626",
            },
            () => PlanAPI.hidePlan(id)
        );

    const handleUnhidePlan = (id) =>
        confirmAction(
            {
                title: "Hiện lại plan này?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Hiện plan",
                confirmButtonColor: "#16a34a",
            },
            () => PlanAPI.unhidePlan(id)
        );

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Quản lý gói dịch vụ
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Tổng số plan:{" "}
                        <span className="font-semibold text-slate-700">
                            {plans.length}
                        </span>
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchPlans}>
                        Làm mới
                    </Button>
                    <Button variant="primary" onClick={handleCreatePlan}>
                        + Thêm plan
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">Đang tải...</div>
            ) : errMsg ? (
                <div className="text-center py-20 text-rose-600">{errMsg}</div>
            ) : sortedPlans.length === 0 ? (
                <div className="text-center py-20">
                    <Button onClick={handleCreatePlan}>+ Thêm plan</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPlans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            onEdit={handleEditPlan}
                            onHide={handleHidePlan}
                            onUnhide={handleUnhidePlan}
                        />
                    ))}
                </div>
            )}

            <PlanFormModal
                open={openPlanModal}
                onClose={() => setOpenPlanModal(false)}
                mode={modalMode}
                planId={selectedPlanId}
                onSuccess={fetchPlans}
            />
        </div>
    );
}
