import axios from "axios";

export const http = axios.create({ baseURL: "/", timeout: 15_000 });

export function accessDenied(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0)
  );
}

export function retryPrivateQuery(attempts: number, error: Error) {
  return (
    attempts < 1 &&
    axios.isAxiosError(error) &&
    (!error.response || error.response.status >= 500)
  );
}
