// src/features/companies/pages/CompanyManagementPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import CompanyAPI from "@/features/companies/CompanyAPI";

import { Card, CardHeader, CardBody } from "@/components/common/Card";
import InfoRow from "@/components/common/InfoRow";
import TagList from "@/components/common/TagList";
import EmptyState from "@/components/common/EmptyState";
import SectionHeader from "@/components/common/SectionHeader";

export default function CompanyManagementPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const navigate = useNavigate();

  const fetchCompany = async () => {
    try {
      const res = await CompanyAPI.getMyCompany();
      setCompany(res.data?.data || null);
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-slate-500">Đang tải thông tin...</p>
    );
  }

  // ❌ Chưa có công ty
  if (!company) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md border text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Bạn chưa có công ty
        </h2>
        <p className="text-slate-600 mb-6">
          Hãy thêm công ty để bắt đầu đăng tin tuyển dụng.
        </p>
        <Button onClick={() => navigate("/recruiter/company/create")}>
          Thêm công ty
        </Button>
      </div>
    );
  }

  // =======================
  //     UI HIỂN THỊ ĐẦY ĐỦ
  // =======================

  return (
    <div className="bg-slate-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          {/* Header dùng SectionHeader + Button chỉnh sửa */}
          <SectionHeader
            title="Thông tin công ty"
            subtitle="Quản lý thông tin doanh nghiệp của bạn"
            actions={
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/recruiter/company/${company.id}/edit`)
                }
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Chỉnh sửa
              </Button>
            }
          />

          <div className="p-6 space-y-6">
            {/* ROW 1: Thông tin chung - FULL WIDTH */}
            <Card>
              <CardHeader icon="🏢" title="Thông tin chung" />
              <CardBody>
                <div className="flex items-start gap-6">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-24 w-24 object-cover rounded-xl border-2 border-slate-200 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium flex-shrink-0 shadow-sm">
                      No Logo
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoRow label="Tên công ty" value={company.name} />
                    <InfoRow
                      label="Website"
                      value={company.website}
                      isLink
                    />
                    <InfoRow
                      label="Ngày thành lập"
                      value={company.founded_date?.split("T")[0]}
                    />
                  </div>
                </div>

                {company.description && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="text-base">📝</span>
                      Mô tả công ty
                    </h4>
                    <div
                      className="prose prose-sm text-slate-700 max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: company.description,
                      }}
                    />
                  </div>
                )}
              </CardBody>
            </Card>

            {/* ROW 2: Địa điểm & Liên hệ - 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Địa điểm & Quy mô */}
              <Card>
                <CardHeader icon="📍" title="Địa điểm & Quy mô" />
                <CardBody>
                  <div className="space-y-5">
                    <InfoRow
                      label="Trụ sở chính"
                      value={company.headquarters}
                    />
                    <InfoRow label="Địa chỉ" value={company.address} />
                    <InfoRow label="Quy mô" value={company.size} />
                  </div>
                </CardBody>
              </Card>

              {/* Thông tin liên hệ */}
              <Card>
                <CardHeader icon="📞" title="Thông tin liên hệ" />
                <CardBody>
                  <div className="space-y-5">
                    <InfoRow
                      label="Email"
                      value={company.contact_email}
                      isEmail
                    />
                    <InfoRow
                      label="Số điện thoại"
                      value={company.contact_phone}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* ROW 3: Lĩnh vực & Tech Stack - 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lĩnh vực hoạt động */}
              <Card>
                <CardHeader icon="🧩" title="Lĩnh vực hoạt động" />
                <CardBody>
                  {company.industry_info?.length ? (
                    <TagList
                      items={company.industry_info.map(
                        (i) => i.industry?.name
                      )}
                      color="blue"
                    />
                  ) : (
                    <EmptyState text="Chưa cập nhật thông tin" />
                  )}
                </CardBody>
              </Card>

              {/* Tech Stack */}
              <Card>
                <CardHeader icon="🛠️" title="Tech Stack" />
                <CardBody>
                  {company.skills?.length ? (
                    <TagList
                      items={company.skills.map((i) => i.skill?.name)}
                      color="emerald"
                    />
                  ) : (
                    <EmptyState text="Chưa cập nhật thông tin" />
                  )}
                </CardBody>
              </Card>
            </div>

            {/* ROW 4: Thông tin pháp lý - FULL WIDTH */}
            <Card>
              <CardHeader icon="📄" title="Thông tin pháp lý" />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow
                    label="Mã số doanh nghiệp"
                    value={company.business_code}
                  />
                  <InfoRow
                    label="Người đại diện"
                    value={company.representative_name}
                  />
                  <InfoRow
                    label="Chức vụ"
                    value={company.representative_position}
                  />
                </div>

                {company.license_file_url && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="text-base">📋</span>
                      Giấy phép kinh doanh
                    </h4>
                    <a
                      href={company.license_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Xem giấy phép
                    </a>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
