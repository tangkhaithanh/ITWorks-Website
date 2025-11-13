import { useCallback, useEffect, useMemo, useState } from "react";
import InterviewAPI from "./InterviewAPI";

const parseItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const extractMeta = (payload, itemsLength) => {
  if (!payload || Array.isArray(payload)) {
    return { total: itemsLength ?? (payload?.length || 0) };
  }
  return {
    total: payload.total ?? payload.meta?.total ?? itemsLength,
    page: payload.page ?? payload.meta?.page,
    pageSize: payload.pageSize ?? payload.meta?.pageSize,
  };
};

const useInterviewSchedules = (initialParams = {}) => {
  const [params, setParams] = useState(initialParams);
  const [schedules, setSchedules] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(
    async (override = {}) => {
      try {
        setLoading(true);
        setError(null);
        const res = await InterviewAPI.list({ ...params, ...override });
        const payload = res?.data?.data ?? res?.data ?? res;
        const items = parseItems(payload);
        setSchedules(items);
        setMeta(extractMeta(payload, items.length));
        return items;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  useEffect(() => {
    fetchSchedules().catch(() => null);
  }, [fetchSchedules]);

  const updateParams = useCallback((updater) => {
    setParams((prev) => {
      if (typeof updater === "function") {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  return useMemo(
    () => ({
      schedules,
      meta,
      loading,
      error,
      params,
      setParams: updateParams,
      refetch: fetchSchedules,
    }),
    [schedules, meta, loading, error, params, updateParams, fetchSchedules]
  );
};

export default useInterviewSchedules;
