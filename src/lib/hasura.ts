export async function hasura<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = process.env.HASURA_GRAPHQL_URL;
  const secret = process.env.HASURA_ADMIN_SECRET;
  if (!url || !secret) {
    throw new Error("Hasura is not configured. Set HASURA_GRAPHQL_URL and HASURA_ADMIN_SECRET.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": secret,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? `Hasura request failed (${response.status})`);
  }

  if (json.data === undefined) {
    throw new Error("Hasura returned no data.");
  }

  return json.data;
}
