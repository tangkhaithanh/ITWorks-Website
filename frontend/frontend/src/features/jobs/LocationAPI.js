import apiClient from "../../service/apiClient";

const LocationAPI = {
    getCities: () => apiClient.get("/locations/cities"),
    getWardsByCity: (cityId) =>
        apiClient.get("/locations/wards", {
            params: { city_id: cityId },
        }),
};

export default LocationAPI;
