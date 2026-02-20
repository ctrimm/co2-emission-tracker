const API_URL = import.meta.env.PUBLIC_API_URL;
if (!API_URL) {
  throw new Error('PUBLIC_API_URL environment variable is not set. Check your .env file or GitHub Actions secrets.');
}

export async function fetchUniqueEmissions() {
  const response = await fetch(`${API_URL}/emissions-unique`);
  if (!response.ok) {
    throw new Error('Failed to fetch unique emissions');
  }
  return response.json();
}

export async function fetchDomainEmissions(domain: string, limit = 30) {
  const response = await fetch(`${API_URL}/emissions/${domain}?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch domain emissions');
  }
  return response.json();
}

export async function fetchSites() {
  const response = await fetch(`${API_URL}/sites`);
  if (!response.ok) {
    throw new Error('Failed to fetch sites');
  }
  return response.json();
}
