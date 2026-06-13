import { useEcho } from '@laravel/echo-react';

export interface PaymentReceivedPayload {
    name: string | null;
    amount: string | null;
    currency: string | null;
    service: string | null;
}

interface Props {
    onNewPayment: (payload: PaymentReceivedPayload) => void;
}

export default function PaymentNotificationListener({ onNewPayment }: Props) {
    useEcho<PaymentReceivedPayload>(
        'admin.transactions',
        'PaymentReceived',
        (e) => {
            onNewPayment(e);
        },
        [onNewPayment],
    );

    return null;
}
