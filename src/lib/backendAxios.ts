import axios from "axios";
import { BACKEND_HTTP_TIMEOUT_MS, HTTP_MAX_REDIRECTS } from "consts";
import { attachStructuredUpstreamLogging } from "lib/reliability/structuredUpstreamLog";
import { attachBackendAxiosMetrics } from "lib/upstreamMetrics";

const instance = axios.create({
  timeout: BACKEND_HTTP_TIMEOUT_MS,
  maxRedirects: HTTP_MAX_REDIRECTS,
});

attachBackendAxiosMetrics(instance);
attachStructuredUpstreamLogging(instance);

export default instance;
