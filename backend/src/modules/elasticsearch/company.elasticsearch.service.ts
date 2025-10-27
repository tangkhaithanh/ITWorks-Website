import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchCompanyService {
  private readonly index = 'companies';
  private readonly logger = new Logger(ElasticsearchCompanyService.name);

  constructor(@Inject('ELASTIC_CLIENT') private readonly es: Client) {}

  async indexCompany(company: any) {
    await this.safeExec('index', company.id, async () =>
      this.es.index({
        index: this.index,
        id: company.id.toString(),
        document: this.mapCompany(company),
      }),
    );
  }

  async updateCompany(company: any) {
  await this.safeExec('update', company.id, async () =>
    this.es.update({
      index: this.index,
      id: company.id.toString(),
      body: {
        doc: this.mapCompany(company),
        doc_as_upsert: true, // ✅ tạo mới nếu chưa tồn tại
      },
    }),
  );
}

  async removeCompany(id: bigint) {
    await this.safeExec('delete', id, async () =>
      this.es.delete({ index: this.index, id: id.toString() }),
    );
  }

  private mapCompany(c: any) {
    return {
      id: c.id?.toString(),
      name: c.name,
      description: c.description,
      address: c.address,
      headquarters: c.headquarters,
      size: c.size,
      industries: c.industry_info?.map((i) => i.industry?.name) ?? [],
      skills: c.skills?.map((s) => s.skill?.name) ?? [],
      status: c.status,
      created_at: c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at,
    };
  }

  private async safeExec(action: string, id: bigint, fn: () => Promise<any>) {
    try {
      await fn();
      this.logger.log(`✅ [${action}] company ${id}`);
    } catch (error) {
      this.logger.warn(`⚠️ [${action}] thất bại (${id}): ${error.message}`);
    }
  }
}
