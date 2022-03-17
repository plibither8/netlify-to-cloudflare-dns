import Cloudflare, {
  DnsRecordWithoutPriority,
  DnsRecordWithPriority,
} from "cloudflare";
import "dotenv/config.js";
import got from "got";

type NetlifyRecordTypes =
  | "A"
  | "AAAA"
  | "ALIAS"
  | "CAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "SPF"
  | "SRV"
  | "TXT"
  | "NETLIFY"
  | "NETLIFYv6";

const NETLIFY_CF_RECORD_TYPES_INTERSECTION = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "SPF",
  "SRV",
  "TXT",
];

interface NetlifyDnsRecord {
  hostname: string;
  type: NetlifyRecordTypes;
  ttl: number;
  priority: number | null;
  weight: number | null;
  port: null | null;
  flag: null;
  tag: null;
  id: string;
  site_id: string | null;
  dns_zone_id: string;
  errors: any[];
  managed: boolean;
  value: string;
}

const NETLIFY_API_BASE = "https://api.netlify.com/api/v1";

async function main() {
  const { DOMAIN } = process.env;
  const slugifiedDomain = DOMAIN.replace(/[^a-zA-Z0-9]/g, "_");
  const records = (await got
    .get(`${NETLIFY_API_BASE}/dns_zones/${slugifiedDomain}/dns_records`, {
      headers: {
        authorization: `Bearer ${process.env.NETLIFY_AUTHORIZATION_TOKEN}`,
      },
    })
    .json()) as NetlifyDnsRecord[];
  const cf = new Cloudflare({ token: process.env.CLOUDFLARE_API_TOKEN });
  for (const record of records) {
    if (
      record.type === "NETLIFYv6" ||
      ("NETLIFY" === record.type && record.hostname === DOMAIN)
    )
      continue;
    if (record.type === "NETLIFY") {
      await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID, {
        type: "CNAME",
        name: record.hostname,
        content: record.value.replace(".com", ".app"),
        ttl: record.ttl,
        proxied: false,
      });
      continue;
    }
    if (NETLIFY_CF_RECORD_TYPES_INTERSECTION.includes(record.type)) {
      console.log("Creating...", record.type, record.hostname, record.value);
      try {
        const cfRecordData: DnsRecordWithPriority | DnsRecordWithoutPriority = {
          type: record.type as any,
          name: record.hostname,
          content: record.value,
          ttl: record.ttl,
          proxied: false,
          priority: undefined,
        };
        if (record.type === "MX") cfRecordData.priority = record.priority;
        await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID, cfRecordData);
      } catch (err) {
        console.log(err.message);
      }
      console.log("Created");
    }
  }
}

main();
