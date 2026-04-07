import axios from "axios";
import { DISPLAY_HTTP_TIMEOUT_MS, HTTP_MAX_REDIRECTS } from "consts";

export default axios.create({
  baseURL: "/api/v1/",
  timeout: DISPLAY_HTTP_TIMEOUT_MS,
  maxRedirects: HTTP_MAX_REDIRECTS,
});
