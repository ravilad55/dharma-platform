import { AxiosError } from "axios";

export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  retryAfter?: number;
}

export function getErrorMessage(
  error: unknown,
  defaultMessage = "An unexpected error occurred. Please try again."
): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiProblemDetails>;
    const data = axiosError.response?.data;

    if (data?.title) {
      return data.title;
    }
    if (data?.detail) {
      return data.detail;
    }
    if (axiosError.response?.status === 429) {
      return "Too many requests. Please wait before trying again.";
    }
    if (axiosError.response?.status === 401) {
      return "The verification code is invalid or expired.";
    }
    if (axiosError.response?.status === 400) {
      return "Please check the entered details and try again.";
    }
    if (axiosError.message === "Network Error" || axiosError.code === "ERR_NETWORK") {
      return "Unable to connect to Dharma server. Please check your network connection.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}
