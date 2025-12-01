import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
type SearchSort =
  | 'newest'
  | 'salary_desc'
  | 'salary_asc'
  | 'deadline_asc'
  | 'distance';

@Injectable()
export class ElasticsearchJobService {
  private readonly index = 'jobs';
  private readonly logger = new Logger(ElasticsearchJobService.name);

  constructor(@Inject('ELASTIC_CLIENT') private readonly es: Client) {
  }

  async onModuleInit() {
    await this.createIndexIfNotExists();
  }
  // Tạo cấu trúc của job trong Elasticsearch, giống như tạo bảng trong SQL
  async createIndexIfNotExists() {
  const exists = await this.es.indices.exists({ index: this.index });
  if (exists) return;

  await this.es.indices.create({
    index: this.index,
    body: {
      settings: {
        analysis: {
          // ===============================
          // 1️⃣ Chuẩn hóa ký tự đặc biệt
          // ===============================
          char_filter: {
            tech_symbol_normalizer: {
              type: 'pattern_replace',
              // Chèn khoảng trắng quanh các pattern đặc trưng của công nghệ
              pattern:
                "(\\+\\+|\\#|\\.js|\\.ts|\\.net|spring[-_ ]?boot|reactjs|react\\.js|nodejs|node\\.js|vuejs|vue\\.js|angular|nestjs|nest\\.js|nextjs|nuxtjs|svelte|golang|go\\b|typescript|javascript|php|laravel|express|fastapi|django|flask|dotnet|.net|js\\b|ts\\b)",
              replacement: " $1 ",
              flags: "CASE_INSENSITIVE",
            },
            tech_expand_abbr: {
              type: 'mapping',
              mappings: [
                // Ngôn ngữ lập trình
                "C\\+\\+ => C plus plus",
                "C# => C sharp",
                ".NET => dot net",
                "DotNet => dot net",
                "JS => javascript",
                "TS => typescript",
                // Framework phổ biến
                "Node.js => Node js",
                "React.js => React js",
                "Vue.js => Vue js",
                "NestJS => Nest JS",
                "Next.js => Next js",
                "Nuxt.js => Nuxt js",
                "Spring-Boot => Spring Boot",
                "SpringBoot => Spring Boot",
                "FastAPI => Fast API",
                "ASP.NET => ASP dot net",
                "AngularJS => Angular js"
              ],
            },
          },

          // ===============================
          // 2️⃣ Tách token và chuẩn hóa chữ
          // ===============================
          filter: {
            tech_word_delimiter: {
              type: 'word_delimiter_graph',
              preserve_original: true,
              split_on_case_change: true,
              generate_word_parts: true,
              generate_number_parts: true,
              catenate_words: true,
              catenate_numbers: true,
              catenate_all: true,
            },
          },

          // ===============================
          // 3️⃣ Analyzer chính cho IT keywords + tiếng Việt
          // ===============================
          analyzer: {
            vietnamese_it_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              char_filter: ['tech_symbol_normalizer', 'tech_expand_abbr'],
              filter: ['lowercase', 'asciifolding', 'tech_word_delimiter'],
            },
          },
        },
      },

      // ===============================
      // 4️⃣ Mapping: định nghĩa field và analyzer
      // ===============================
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'vietnamese_it_analyzer' },
          company_name: { type: 'text', analyzer: 'vietnamese_it_analyzer' },
          company_logo: { type: 'keyword' },
          skills: {
          type: 'text',
          analyzer: 'vietnamese_it_analyzer',
          fields: {
            keyword: { type: 'keyword' }  // 👈 thêm dòng này
          }
        },
          category: {
          type: 'text',
          analyzer: 'vietnamese_it_analyzer',
          fields: {
            keyword: { type: 'keyword' } // 🟢 thêm field phụ để lọc exact match
          }
        },
          location_full: { type: 'text', analyzer: 'vietnamese_it_analyzer' },
          location_city: { type: 'keyword' },
          location_district: { type: 'keyword' },
          location_ward: { type: 'keyword' },
          location_street: { type: 'keyword' },
          status: { type: 'keyword' },
          salary_min: { type: 'float' },
          salary_max: { type: 'float' },
          negotiable: { type: 'boolean' },
          work_modes: { type: 'keyword' },
          experience_levels: { type: 'keyword' },
          employment_type: { type: 'keyword' },
          geo: { type: 'geo_point' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
          deadline: { type: 'date' },
          // Autocomplete gợi ý
          suggest: { type: 'completion', analyzer: 'vietnamese_it_analyzer' },
        },
      },
    },
  });

  console.log('✅ Elasticsearch index "jobs" created with full IT analyzer');
}


  async indexJob(job: any) {
  try {
    // 🧩 Bước 1: Convert BigInt -> string (tránh lỗi serialize)
    const plainJob = JSON.parse(
      JSON.stringify(job, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    // 🧩 Bước 2: Map job thành cấu trúc phẳng chuẩn Elasticsearch
    const doc = this.mapJob(plainJob);

    // 🧩 Bước 3: Index vào Elasticsearch
    await this.es.index({
      index: 'jobs',
      id: String(doc.id),
      document: doc,
    });
  } catch (error) {
    console.warn('⚠️ [index] thất bại:', error.message);
  }
}

  async updateJob(job: any) {
  try {
    // Convert BigInt → string giống indexJob()
    const plainJob = JSON.parse(JSON.stringify(job, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ));

    const doc = this.mapJob(plainJob);

    await this.es.update({
      index: this.index,
      id: doc.id.toString(),
      body: {
        doc,
        doc_as_upsert: true, // Nếu chưa tồn tại thì tạo mới
      },
    });
  } catch (error) {
    console.warn(`⚠️ [update] thất bại (${job.id}):`, error.message);
  }
}


  async removeJob(id: bigint) {
    await this.safeExec('delete', id, async () =>
      this.es.delete({ index: this.index, id: id.toString() }),
    );
  }

// Đây là hàm nhận dữ liệu từ Database, sau đó làm phẳng và chuẩn hóa thành cấu trúc phù hợp với Elasticsearch, chúng lựa chọn các trường phù hợp để đưa vào ElasticSearch
  private mapJob(job: any) {
  const parseJsonArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return [];
  };

  const inputs = new Set<string>();

  // 🧩 Gợi ý chính
  if (job.title) inputs.add(job.title);
  if (job.company?.name) inputs.add(job.company.name);

  // 🧩 Skills
  const skills =
    Array.isArray(job.skills)
      ? job.skills.map((s: any) => s.skill?.name ?? s.name).filter(Boolean)
      : [];
  skills.forEach((s) => inputs.add(s));

  // 🧩 Category
  const categoryName = job.category?.name ?? job.category;
  if (categoryName) inputs.add(categoryName);


  // 🧩 Work mode / experience / employment
  const workModes = parseJsonArray(job.work_modes);
  const experienceLevels = parseJsonArray(job.experience_levels);
  const employmentTypes = parseJsonArray(job.employment_type);

  workModes.forEach((m) => typeof m === 'string' && m.trim() && inputs.add(m.trim()));
  experienceLevels.forEach((e) => typeof e === 'string' && e.trim() && inputs.add(e.trim()));
  employmentTypes.forEach((t) => typeof t === 'string' && t.trim() && inputs.add(t.trim()));


  // ✅ Filter lại toàn bộ
  const suggestInputs = Array.from(inputs).filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  );

  return {
    id: job.id,
    title: job.title,
    company_name: job.company?.name ?? job.company_name ?? null,
    company_logo: job.company?.logo_url ?? job.logo_company ?? null,
    skills,
    category: categoryName,
    location_city: job.location_city,
    location_district: job.location_district,
    location_ward: job.location_ward,
    location_street: job.location_street,
    location_full:
      job.location_full ??
      [job.location_street, job.location_ward, job.location_district, job.location_city]
        .filter(Boolean)
        .join(', '),
    status: job.status,
    created_at: job.created_at,
    updated_at: job.updated_at,
    deadline: job.deadline ?? null,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    negotiable: job.negotiable,
    work_modes: workModes,
    experience_levels: experienceLevels,
    employment_type: employmentTypes,
    latitude: job.latitude,
    longitude: job.longitude,
    geo:
      job.latitude && job.longitude
        ? { lat: job.latitude, lon: job.longitude }
        : undefined,
    suggest: {
      input: suggestInputs,
      weight: 10,
    },
  };
}


// Hàm tìm kiếm job
async searchJobs(params: {
  keyword?: string;
  city?: string;
  district?: string;
  ward?: string;
  street?: string;
  work_modes?: string[];
  experience_levels?: string[];
  skills?: string[];
  negotiable?: boolean;
  employment_type?: string[];
  category?: string;
  min_salary?: number;
  max_salary?: number;
  lat?: number;
  lon?: number;
  radius_km?: number;
  page?: number;
  limit?: number;
  sort?: SearchSort;
}) {
  const {
    keyword,
    city,
    district,
    ward,
    street,
    work_modes,
    experience_levels,
    skills,
    negotiable,
    employment_type,
    category,
    min_salary,
    max_salary,
    lat,
    lon,
    radius_km,
    page = 1,
    limit = 10,
    sort = 'newest',
  } = params;
    let wm = work_modes;
    let exp = experience_levels;

    if (typeof wm === 'string') wm = [wm];
    if (typeof exp === 'string') exp = [exp];


    const must: any[] = [];
    const filter: any[] = [];

    // full-text
if (keyword) {
  const useFuzziness = keyword.includes(' ')
    ? 0
    : keyword.length >= 4
    ? 'AUTO'
    : 0;

  must.push({
    bool: {
      minimum_should_match: 1,
      should: [
        // 1️⃣ Exact phrase match trong title
        {
          match_phrase: {
            title: {
              query: keyword,
              boost: 15,
            },
          },
        },

        // 2️⃣ Exact phrase match trong skills
        {
          match_phrase: {
            skills: {
              query: keyword,
              boost: 8,
            },
          },
        },

        // 3️⃣ Exact phrase match trong category
        {
          match_phrase: {
            category: {
              query: keyword,
              boost: 6,
            },
          },
        },

        // ⚡ 4️⃣ Exact match trong experience_levels
        {
          match_phrase: {
            experience_levels: {
              query: keyword.toLowerCase(),
              boost: 10,
            },
          },
        },

        // ⚡ 5️⃣ Exact match trong work_modes (remote, onsite, hybrid)
        {
          match_phrase: {
            work_modes: {
              query: keyword.toLowerCase(),
              boost: 9,
            },
          },
        },

        // 6️⃣ Fuzzy fallback
        {
          multi_match: {
            query: keyword,
            fields: [
              'title^2',
              'skills^1.5',
              'company_name',
              'category',
              'location_full',
              'experience_levels^3',
              'work_modes^3',
            ],
            fuzziness: useFuzziness,
            minimum_should_match: '100%',
            boost: 0.5,
          },
        },

        // 7️⃣ Prefix fallback (reactjs, nodejs)
        {
          multi_match: {
            query: keyword.replace(/js$/i, ' js'),
            fields: ['title^2', 'skills^2', 'category'],
            type: 'phrase_prefix',
            boost: 0.8,
          },
        },
      ],
    },
  });
}



    // address filters
    if (city)     filter.push({ term: { location_city: city } });
    if (district) filter.push({ term: { location_district: district } });
    if (ward)     filter.push({ term: { location_ward: ward } });
    if (street)   filter.push({ term: { location_street: street } });

    // arrays
    if (wm?.length)  filter.push({ terms: { work_modes: wm } });
    if (exp?.length) filter.push({ terms: { experience_levels: exp } });
    // enums / flags
    if (typeof negotiable === 'boolean')   filter.push({ term: { negotiable } });
    if (skills?.length) filter.push({ terms: { 'skills.keyword': skills } });
    if (employment_type?.length) {
      filter.push({
        bool: {
          should: employment_type.map(t => ({
            term: { employment_type: t },
          })),
        },
      });
  }

    if (category) filter.push({ term: { 'category.keyword': category } });
    // salary range (lọc overlap chuẩn)
    if (min_salary != null || max_salary != null) {
      if (min_salary != null && max_salary != null) {
        // cả hai đầu
        filter.push({
          bool: {
            must: [
              { range: { salary_max: { gte: min_salary } } },
              { range: { salary_min: { lte: max_salary } } },
            ],
          },
        });
      } else if (min_salary != null) {
        // chỉ có min_salary: tìm job có lương max >= min_salary
        filter.push({ range: { salary_max: { gte: min_salary } } });
      } else if (max_salary != null) {
        // chỉ có max_salary: tìm job có lương min <= max_salary
        filter.push({ range: { salary_min: { lte: max_salary } } });
      }
    }

    // status
    filter.push({ term: { status: 'active' } });

    // geo radius (optional)
    let postFilter: any = undefined;
    if (lat != null && lon != null && radius_km != null) {
      postFilter = {
        geo_distance: {
          distance: `${radius_km}km`,
          geo: { lat, lon },
        },
      };
    }

    // sort
    const sortClause: any[] =
      sort === 'salary_desc'
        ? [{ salary_max: 'desc' }]
        : sort === 'salary_asc'
        ? [{ salary_min: 'asc' }]
        : sort === 'deadline_asc'
        ? [{ deadline: 'asc' }, { created_at: 'desc' }]
        : sort === 'distance' && lat != null && lon != null
        ? [
            {
              _geo_distance: {
                geo: { lat, lon },
                order: 'asc',
                unit: 'km',
                mode: 'min',
                distance_type: 'arc',
              },
            },
          ]
        : [{ created_at: 'desc' }];

    const from = (page - 1) * limit;

    const body: any = {
      from,
      size: limit,
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: sortClause,
    };

    if (postFilter) {
      // dùng post_filter để giữ nguyên scoring/sort nhưng lọc theo bán kính
      body.post_filter = postFilter;
    }

    const result = await this.es.search({ index: this.index, body });

    const hits = (result as any).hits.hits.map((h: any) => ({
      id: h._id,
      score: h._score,
      ...h._source,
    }));

    return {
      total: (result as any).hits.total.value,
      page,
      limit,
      results: hits,
    };
  }

  // Hàm tìm gợi ý từ khóa:
  async suggestJobs(prefix: string) {
  // Chuẩn hóa input (tránh lỗi khi người dùng gõ khoảng trắng hoặc hoa/thường)
  const cleanPrefix = prefix.trim().toLowerCase();
  if (!cleanPrefix) return [];

  const result = await this.es.search({
    index: this.index,
    body: {
      suggest: {
        'job-suggest': {
          prefix: cleanPrefix,
          completion: {
            field: 'suggest',
            size: 8,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 0, // 🔹 chỉ match prefix chính xác
            },
          },
        },
      },
    },
  });

  const opts = (result as any).suggest['job-suggest'][0]?.options ?? [];

  // Lọc chính xác (phòng khi Elasticsearch vẫn trả hơi rộng)
  const suggestions = opts
    .map((o: any) => o.text)
    .filter((t: string) => t.toLowerCase().startsWith(cleanPrefix))
    .slice(0, 8);

  return suggestions;
}

  private async safeExec(action: string, id: bigint, fn: () => Promise<any>) {
    try {
      await fn();
      this.logger.log(`✅ [${action}] job ${id}`);
    } catch (error) {
      this.logger.warn(`⚠️ [${action}] thất bại (${id}): ${error.message}`);
    }
  }
}
