const API_URL = import.meta.env.PUBLIC_API_URL;

export async function fetchEmissions() {
  const response = await fetch(`${API_URL}/emissions`);
  if (!response.ok) {
    throw new Error('Failed to fetch emissions');
  }
  return response.json();
}

export async function fetchDomainEmissions(domain: string) {
  const response = await fetch(`${API_URL}/emissions/${domain}`);
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
