import { PaginationState } from "@/shared/components/pagination/Pagination";
import { PaymentMethodsApiResponse, PaymentMethod } from "../types/PaymentMethods.types";

export const PaymentMethodsAdapter = (response: PaymentMethodsApiResponse) => {
    const formattedPaymentMethods: PaymentMethod[] = response.data || [];

    const pagination: PaginationState = {
        p_page: response.page.page,
        p_size: response.page.size,
        total: response.page.total,
    };

    return { data: formattedPaymentMethods, pagination };
};
