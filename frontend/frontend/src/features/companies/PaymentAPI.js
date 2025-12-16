import apiClient from "../../service/apiClient";

const PaymentAPI = {
    createVnpayPayment: (data) => apiClient.post("/payments/vnpay/create", data),
    getOrder: (id) => apiClient.get(`/payments/orders/${id}`),
    getOrders: (params) =>
        apiClient.get("/payments/orders", { params }),
};

export default PaymentAPI;
