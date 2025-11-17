import { useCallback, useEffect, useState } from "react";
import api from "./api";

const initialState = {
  data: null,
  loading: false,
  error: "",
  meta: null
};

function useGeoJsonResource(endpoint, { enabled = true } = {}) {
  const [state, setState] = useState(initialState);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await api.get(endpoint);
      const payload = data?.data || null;
      setState({ data: payload, loading: false, error: "", meta: data?.meta || null });
    } catch (error) {
      const message = error?.response?.data?.error || "No se pudo cargar la capa";
      setState({ data: null, loading: false, error: message, meta: null });
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!enabled) return;
      if (ignore) return;
      await fetchData();
    }
    run();
    return () => {
      ignore = true;
    };
  }, [enabled, fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    meta: state.meta,
    refresh: fetchData
  };
}

export default function useTransmilenioData({ enabled = true } = {}) {
  const routes = useGeoJsonResource("/maps/transmilenio/routes", { enabled });
  const stations = useGeoJsonResource("/maps/transmilenio/stations", { enabled });

  return {
    routes: routes.data,
    stations: stations.data,
    loading: routes.loading || stations.loading,
    error: routes.error || stations.error,
    refreshRoutes: routes.refresh,
    refreshStations: stations.refresh
  };
}
