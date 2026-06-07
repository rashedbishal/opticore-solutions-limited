import type { ReactNode } from 'react';
import { useState } from 'react';

type FormDataShape = Record<string, unknown>;
type FormErrors = Partial<Record<string, string>>;

export function useFormMock<T extends FormDataShape>(initialData: T) {
    const [data, setDataState] = useState<T>(initialData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing] = useState(false);

    const setData = (
        keyOrData: keyof T | Partial<T>,
        maybeValue?: unknown,
    ) => {
        if (typeof keyOrData === 'object') {
            setDataState((current) => ({ ...current, ...keyOrData }));

            return;
        }

        setDataState((current) => ({
            ...current,
            [keyOrData]: maybeValue,
        }));
    };

    const setError = (
        keyOrErrors: keyof T | FormErrors,
        maybeMessage?: string,
    ) => {
        if (typeof keyOrErrors === 'object') {
            setErrors((current) => ({
                ...current,
                ...(keyOrErrors as FormErrors),
            }));

            return;
        }

        setErrors((current) => ({
            ...current,
            [keyOrErrors as string]: maybeMessage,
        }));
    };

    const clearErrors = (...keys: string[]) => {
        if (keys.length === 0) {
            setErrors({});

            return;
        }

        setErrors((current) =>
            Object.fromEntries(
                Object.entries(current).filter(([key]) => !keys.includes(key)),
            ),
        );
    };

    /**
     * Simulates the Laravel/Inertia server-validation round trip for forms
     * that rely on `errors` returned from `post`/`put`/etc. rather than
     * client-side validation: any empty string field is reported as
     * required, mirroring Laravel's default "The {field} field is required."
     * message, and the response is routed through onError/onFinish like a
     * real Inertia visit would.
     */
    const simulateServerVisit = (
        _url?: string,
        options?: {
            onError?: (errors: FormErrors) => void;
            onFinish?: () => void;
        },
    ) => {
        const responseErrors: FormErrors = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value === '') {
                responseErrors[key] =
                    `The ${key.replace(/_/g, ' ')} field is required.`;
            }
        });

        if (Object.keys(responseErrors).length > 0) {
            setErrors((current) => ({ ...current, ...responseErrors }));
            options?.onError?.(responseErrors);
        }

        options?.onFinish?.();
    };

    return {
        data,
        setData,
        errors,
        setError,
        clearErrors,
        reset: () => setDataState(initialData),
        processing,
        progress: null,
        wasSuccessful: false,
        recentlySuccessful: false,
        hasErrors: Object.keys(errors).length > 0,
        isDirty: false,
        post: vi.fn(simulateServerVisit),
        get: vi.fn(simulateServerVisit),
        put: vi.fn(simulateServerVisit),
        patch: vi.fn(simulateServerVisit),
        delete: vi.fn(simulateServerVisit),
        submit: vi.fn(),
        transform: vi.fn(),
        cancel: vi.fn(),
    };
}

export const inertiaMock = {
    Head: ({ children }: { children?: ReactNode }) => <>{children}</>,
    Link: ({
        href,
        children,
        ...props
    }: {
        href?: string;
        children?: ReactNode;
        [key: string]: unknown;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        visit: vi.fn(),
        reload: vi.fn(),
        replace: vi.fn(),
        on: vi.fn(),
        cancel: vi.fn(),
    },
};
