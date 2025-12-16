import { useEffect, useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import PlanAPI from "../PlantAPI";
import Swal from "sweetalert2";
import JoditEditor from "jodit-react";

const emptyForm = {
    name: "",
    price: "",
    job_limit: "",
    credit_amount: "",
    duration_days: "",
    features: "",
};

const joditConfig = {
    readonly: false,
    height: 360,
    placeholder: "Nhập mô tả quyền lợi của plan...",
    buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "link",
        "image",
        "|",
        "align",
        "|",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
    ],
};

export default function PlanFormModal({
    open,
    onClose,
    mode = "create", // "create" | "edit"
    planId,
    onSuccess,
}) {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const editorRef = useRef(null);

    // 👉 Load plan khi edit
    useEffect(() => {
        if (!open) return;

        if (mode === "create") {
            setForm(emptyForm);
            return;
        }

        const fetchPlan = async () => {
            try {
                const res = await PlanAPI.getAdminDetail(planId);
                const p = res?.data?.data;

                setForm({
                    name: p?.name ?? "",
                    price: p?.price ?? "",
                    job_limit: p?.job_limit ?? "",
                    credit_amount: p?.credit_amount ?? "",
                    duration_days: p?.duration_days ?? "",
                    features: p?.features ?? "",
                });
            } catch (err) {
                Swal.fire("Lỗi", "Không thể tải thông tin plan", "error");
                onClose?.();
            }
        };

        fetchPlan();
    }, [open, mode, planId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                job_limit: Number(form.job_limit),
                credit_amount: Number(form.credit_amount),
                duration_days: Number(form.duration_days),
            };

            if (mode === "create") {
                await PlanAPI.create(payload);
            } else {
                await PlanAPI.update(planId, payload);
            }

            Swal.fire(
                "Thành công",
                mode === "create" ? "Đã tạo plan mới" : "Đã cập nhật plan",
                "success"
            );

            onSuccess?.();
            onClose?.();
        } catch (err) {
            Swal.fire(
                "Lỗi",
                err?.response?.data?.message || "Có lỗi xảy ra",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={mode === "create" ? "Thêm plan mới" : "Chỉnh sửa plan"}
            width="max-w-4xl"
        >
            {/* BODY – SCROLL */}
            <div className="max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-4">
                        <TextInput
                            label="Tên plan"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ví dụ: Premium"
                            required
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextInput
                                label="Giá (VND)"
                                name="price"
                                type="number"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="1000000"
                                required
                            />

                            <TextInput
                                label="Số ngày sử dụng"
                                name="duration_days"
                                type="number"
                                value={form.duration_days}
                                onChange={handleChange}
                                placeholder="30"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextInput
                                label="Giới hạn job"
                                name="job_limit"
                                type="number"
                                value={form.job_limit}
                                onChange={handleChange}
                                placeholder="Số job"
                                required
                            />

                            <TextInput
                                label="Credit"
                                name="credit_amount"
                                type="number"
                                value={form.credit_amount}
                                onChange={handleChange}
                                placeholder="Số credit"
                                required
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN – RICH TEXT */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Mô tả / Features
                        </label>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <JoditEditor
                                ref={editorRef}
                                value={form.features}
                                config={joditConfig}
                                onBlur={(newContent) =>
                                    handleChange({
                                        target: {
                                            name: "features",
                                            value: newContent,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER – FIXED */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={onClose}>
                    Huỷ
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {mode === "create" ? "Tạo plan" : "Lưu thay đổi"}
                </Button>
            </div>
        </Modal>
    );
}
