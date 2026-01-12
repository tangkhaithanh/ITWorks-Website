import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * CONFIG
 */
const MYSQL_HOST = process.env.MYSQL_HOST!;
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER!;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD!;
const MYSQL_DB = process.env.MYSQL_DB!; // recruiment_system (đúng chính tả DB)
const BATCH_SIZE = Number(process.env.MIGRATE_BATCH_SIZE || 1000);

/**
 * FETCH BATCH BY PK (⚠️ chỉ dùng cho bảng PK auto-increment)
 */
async function fetchBatch(
  conn: mysql.Connection,
  table: string,
  pk: string,
  lastPk: number,
  limit: number,
) {
  const sql = `
    SELECT *
    FROM \`${table}\`
    WHERE \`${pk}\` > ?
    ORDER BY \`${pk}\` ASC
    LIMIT ${limit}
  `;

  const [rows] = await conn.execute(sql, [Number(lastPk)]);
  return rows as any[];
}

/**
 * MIGRATE TABLE BY PK
 */
async function migrateByPk(
  conn: mysql.Connection,
  table: string,
  pk: string,
  prismaModel: keyof PrismaClient,
) {
  console.log(`➡️ Migrating ${table}...`);

  let lastPk = 0;

  while (true) {
    const rows = await fetchBatch(conn, table, pk, lastPk, BATCH_SIZE);
    if (rows.length === 0) break;
    // Chuẩn hóa dữ liệu MySQL -> Prisma
    const normalizedRows = rows.map((row) => {
      const r = { ...row };

      // 🔥 Convert tinyint -> boolean
      if ('is_hidden' in r) r.is_hidden = Boolean(r.is_hidden);
      if ('is_deleted' in r) r.is_deleted = Boolean(r.is_deleted);
      if ('negotiable' in r) r.negotiable = Boolean(r.negotiable);
      if ('is_read' in r) r.is_read = Boolean(r.is_read);
      if ('must_change_password' in r)
        r.must_change_password = Boolean(r.must_change_password);

      return r;
    });
    // Insert Postgres
    // @ts-ignore
    await prisma[prismaModel].createMany({
      data: normalizedRows,
      skipDuplicates: true,
    });

    lastPk = Number(rows[rows.length - 1][pk]);
    console.log(`   ✔ ${table}: migrated up to ${pk} = ${lastPk}`);
  }
}

/**
 * MAIN
 */
async function main() {
  console.log('🚀 Starting MySQL → PostgreSQL migration');

  // 1️⃣ Connect MySQL (KHÔNG set database)
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
  });

  console.log('✅ MySQL connected');

  // Debug instance
  const [dbs] = await connection.query('SHOW DATABASES');
  console.log('📦 Databases seen by script:', dbs);

  // 2️⃣ USE database (sau khi connect)
  await connection.query(`USE \`${MYSQL_DB}\``);
  console.log(`✅ Using database ${MYSQL_DB}`);

  const conn = connection;

  /**
   * ⚠️ THỨ TỰ RẤT QUAN TRỌNG (FK)
   */
  await migrateByPk(conn, 'industry', 'id', 'industry');
  await migrateByPk(conn, 'skill', 'id', 'skill');
  await migrateByPk(conn, 'jobcategory', 'id', 'jobCategory');
  await migrateByPk(conn, 'cvtemplate', 'id', 'cvTemplate');
  await migrateByPk(conn, 'plan', 'id', 'plan');
  await migrateByPk(conn, 'boostrule', 'id', 'boostRule');

  await migrateByPk(conn, 'account', 'id', 'account');
  await migrateByPk(conn, 'user', 'id', 'user');
  await migrateByPk(conn, 'company', 'id', 'company');

  await migrateByPk(conn, 'candidate', 'id', 'candidate');
  await migrateByPk(conn, 'job', 'id', 'job');
  await migrateByPk(conn, 'jobdetail', 'job_id', 'jobDetail');
  await migrateByPk(conn, 'cv', 'id', 'cv');
  await migrateByPk(conn, 'application', 'id', 'application');
  await migrateByPk(conn, 'interview', 'id', 'interview');

  await migrateByPk(conn, 'savedjob', 'id', 'savedJob');
  await migrateByPk(conn, 'notification', 'id', 'notification');
  await migrateByPk(conn, 'adminlog', 'id', 'adminLog');

  await migrateByPk(conn, 'paymentorder', 'id', 'paymentOrder');
  await migrateByPk(conn, 'companyplan', 'id', 'companyPlan');
  await migrateByPk(conn, 'companyplanhistory', 'id', 'companyPlanHistory');
  await migrateByPk(conn, 'credittransaction', 'id', 'creditTransaction');
  await migrateByPk(conn, 'jobboost', 'id', 'jobBoost');

  await migrateByPk(conn, 'sitestatistic', 'id', 'siteStatistic');
  await migrateByPk(conn, 'recruiterstatistic', 'id', 'recruiterStatistic');

  /**
   * ⚠️ MANY-TO-MANY / LOOKUP (chạy sau cùng)
   */
  await migrateByPk(conn, 'companyindustry', 'id', 'companyIndustry');
  await migrateByPk(conn, 'companyskill', 'id', 'companySkill');
  await migrateByPk(conn, 'jobskill', 'id', 'jobSkill');
  await migrateByPk(conn, 'candidateskill', 'id', 'candidateSkill');
  await migrateByPk(conn, 'locationcity', 'id', 'locationCity');
  await migrateByPk(conn, 'locationward', 'id', 'locationWard');

  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY');

  await connection.end();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ MIGRATION FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
