import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import CvAPI from "../CvAPI";

const emptyContent = {
  personal: { fullName: "", email: "", phone: "" },
  education: [],
  experience: [],
  skills: [],
  projects: [],
};

const normalizeCvContent = (content = emptyContent) => ({
  personal: {
    fullName: content?.personal?.fullName ?? "",
    email: content?.personal?.email ?? "",
    phone: content?.personal?.phone ?? "",
  },
  education: (content?.education ?? []).map((item) => ({
    school: item?.school ?? "",
    degree: item?.degree ?? "",
    startDate: item?.startDate ?? "",
    endDate: item?.endDate ?? "",
  })),
  experience: (content?.experience ?? []).map((item) => ({
    company: item?.company ?? "",
    role: item?.role ?? "",
    description: item?.description ?? "",
  })),
  skills: (content?.skills ?? []).map((item) => String(item ?? "")).filter(Boolean),
  projects: (content?.projects ?? []).map((item) => ({
    name: item?.name ?? "",
    description: item?.description ?? "",
  })),
});

const OnlineCvBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = useMemo(() => id && id !== "new", [id]);

  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    title: "",
    template_id: "",
    content: emptyContent,
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [templateRes, cvRes] = await Promise.all([
          CvAPI.listTemplates(),
          isEditing ? CvAPI.getDetail(id) : Promise.resolve(null),
        ]);
        const templateItems = templateRes.data?.data ?? templateRes.data ?? [];
        setTemplates(templateItems);

        if (cvRes) {
          const cv = cvRes.data?.data ?? cvRes.data;
          setForm({
            title: cv.title || "",
            template_id: cv.template_id || "",
            content: cv.content || emptyContent,
          });
        } else if (templateItems[0]) {
          setForm((prev) => ({ ...prev, template_id: templateItems[0].id }));
        }
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, isEditing]);

  useEffect(() => {
    const doPreview = async () => {
      if (!form.template_id) return;
      try {
        const payload = {
          title: form.title || "CV Online",
          template_id: Number(form.template_id),
          content: normalizeCvContent(form.content),
        };
        const res = await CvAPI.previewOnline(payload);
        setPreviewHtml((res.data?.data ?? res.data).html || "");
      } catch {
        setPreviewHtml("");
      }
    };
    const timer = setTimeout(doPreview, 300);
    return () => clearTimeout(timer);
  }, [form]);

  const updatePersonal = (key, value) => {
    setForm((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        personal: { ...prev.content.personal, [key]: value },
      },
    }));
  };

  const parseTextLines = (text, mapper) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(mapper);

  const saveCv = async () => {
    const payload = {
      title: form.title || "CV Online",
      template_id: Number(form.template_id),
      content: normalizeCvContent(form.content),
    };
    if (isEditing) {
      await CvAPI.update(id, payload);
      alert("Da cap nhat CV");
    } else {
      const res = await CvAPI.createOnline(payload);
      const cv = res.data?.data ?? res.data;
      alert("Da tao CV moi");
      navigate(`/manage-cv/online/${cv.id}`);
    }
  };

  const deleteCv = async () => {
    if (!isEditing) return;
    await CvAPI.delete(id);
    alert("Da xoa CV");
    navigate("/manage-cv");
  };

  const exportPdf = async () => {
    if (!isEditing) return;
    const res = await CvAPI.exportOnlinePdf(id);
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cv-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8">Dang tai CV builder...</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? "Chinh sua CV online" : "Tao CV online"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Chon template, nhap du lieu va xem preview realtime truoc khi luu.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6 items-start">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Thong tin CV</h2>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Tieu de CV</label>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="VD: Frontend Developer - ReactJS"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Template</label>
                <select
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.template_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, template_id: e.target.value }))}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} v{t.version}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Thong tin ca nhan</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input className="border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Ho va ten" value={form.content.personal.fullName || ""} onChange={(e) => updatePersonal("fullName", e.target.value)} />
                <input className="border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="So dien thoai" value={form.content.personal.phone || ""} onChange={(e) => updatePersonal("phone", e.target.value)} />
                <input className="md:col-span-2 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Email" value={form.content.personal.email || ""} onChange={(e) => updatePersonal("email", e.target.value)} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Ky nang</h3>
              <p className="text-xs text-slate-500">Moi dong la 1 ky nang. Vi du: ReactJS</p>
              <textarea
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="ReactJS&#10;TypeScript&#10;TailwindCSS"
                defaultValue={(form.content.skills || []).join("\n")}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      skills: parseTextLines(e.target.value, (line) => line),
                    },
                  }))
                }
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Hoc van</h3>
              <p className="text-xs text-slate-500">Moi dong: school|degree|start|end</p>
              <textarea
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="UIT|Ky su phan mem|2020|2024"
                defaultValue={(form.content.education || [])
                  .map((x) => `${x.school || ""}|${x.degree || ""}|${x.startDate || ""}|${x.endDate || ""}`)
                  .join("\n")}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      education: parseTextLines(e.target.value, (line) => {
                        const [school, degree, startDate, endDate] = line.split("|");
                        return {
                          school: school ?? "",
                          degree: degree ?? "",
                          startDate: startDate ?? "",
                          endDate: endDate ?? "",
                        };
                      }),
                    },
                  }))
                }
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Kinh nghiem</h3>
              <p className="text-xs text-slate-500">Moi dong: company|role|description</p>
              <textarea
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="ITWorks|Frontend Intern|Xay dung giao dien dashboard"
                defaultValue={(form.content.experience || [])
                  .map((x) => `${x.company || ""}|${x.role || ""}|${x.description || ""}`)
                  .join("\n")}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      experience: parseTextLines(e.target.value, (line) => {
                        const [company, role, description] = line.split("|");
                        return {
                          company: company ?? "",
                          role: role ?? "",
                          description: description ?? "",
                        };
                      }),
                    },
                  }))
                }
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Du an</h3>
              <p className="text-xs text-slate-500">Moi dong: name|description</p>
              <textarea
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Online CV Builder|Nen tang tao CV theo template"
                defaultValue={(form.content.projects || [])
                  .map((x) => `${x.name || ""}|${x.description || ""}`)
                  .join("\n")}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      projects: parseTextLines(e.target.value, (line) => {
                        const [name, description] = line.split("|");
                        return { name: name ?? "", description: description ?? "" };
                      }),
                    },
                  }))
                }
              />
            </section>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex flex-wrap gap-2">
            <Button onClick={saveCv}>Luu CV</Button>
            {isEditing && (
              <>
                <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
                <Button variant="outline" onClick={deleteCv}>Xoa CV</Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-4">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Preview realtime</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Auto update
            </span>
          </div>
          <div className="p-4 bg-slate-100 rounded-b-2xl">
            <div className="mx-auto w-full max-w-[760px] bg-white shadow-xl rounded-md overflow-hidden min-h-[760px]">
              {previewHtml ? (
                <iframe title="cv-preview" className="w-full h-[760px] bg-white" srcDoc={previewHtml} />
              ) : (
                <div className="p-6 text-slate-500 text-sm">Chua co preview. Hay nhap thong tin CV de xem truoc.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCvBuilderPage;
