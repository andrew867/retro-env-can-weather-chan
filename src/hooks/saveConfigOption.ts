import axios from "lib/axios";
import { useState } from "react";

export function useSaveConfigOption<T = any>(endpoint: string, baseURL: string = "config") {
  const [isSaving, setIsSaving] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);
  const [wasError, setWasError] = useState(false);
  const [response, setResponse] = useState<T>();

  const saveConfigOption = async (body: object, isNew: boolean = false): Promise<T | undefined> => {
    if (!body || !endpoint) return undefined;

    resetState();
    setIsSaving(true);

    const method = isNew ? "put" : "post";
    try {
      const resp = await axios[method](`${baseURL}/${endpoint}`, body);
      const data = resp.data as T | undefined;
      if (data !== undefined && data !== null) setResponse(data);
      setWasSuccess(true);
      return data;
    } catch {
      setWasError(true);
      return undefined;
    } finally {
      setIsSaving(false);
    }
  };

  const resetState = () => {
    setWasSuccess(false);
    setWasError(false);
  };

  return { saveConfigOption, isSaving, wasSuccess, wasError, response };
}
