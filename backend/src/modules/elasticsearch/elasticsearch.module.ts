import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchCompanyService } from './company.elasticsearch.service';
import { ElasticsearchJobService } from './job.elasticsearch.service';

@Global()
@Module({
  providers: [
    {
      provide: 'ELASTIC_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const node =
          configService.get<string>('ELASTICSEARCH_NODE') ||
          'http://localhost:9200';

        const username =
          configService.get<string>('ELASTICSEARCH_USERNAME') || 'elastic';

        const password =
          configService.get<string>('ELASTICSEARCH_PASSWORD') || '';

        console.log('✅ Elasticsearch node:', node);
        console.log('✅ Elasticsearch user:', username);

        return new Client({
          node,
          auth: {
            username,
            password,
          },
          maxRetries: 1,
          requestTimeout: 5000,
          sniffOnStart: false,
        });
      },
    },
    ElasticsearchCompanyService,
    ElasticsearchJobService,
  ],
  exports: [
    'ELASTIC_CLIENT',
    ElasticsearchCompanyService,
    ElasticsearchJobService,
  ],
})
export class ElasticsearchCustomModule {}
