/**
 * Earpiece / loudspeaker on Android Chrome & Edge via setSinkId. Where the
 * browser can't tell them apart (iPhone, computers) there's no switch.
 */
export interface OutputDevices {
    speakerId: string | null;
    earpieceId: string | null;
}

export async function findOutputDevices(): Promise<OutputDevices> {
    if (typeof navigator.mediaDevices?.enumerateDevices !== 'function') {
        return { speakerId: null, earpieceId: null };
    }

    try {
        const outputs = (
            await navigator.mediaDevices.enumerateDevices()
        ).filter((d) => d.kind === 'audiooutput');

        return {
            speakerId:
                outputs.find((d) => /speaker/i.test(d.label))?.deviceId ?? null,
            earpieceId:
                outputs.find((d) => /earpiece|receiver/i.test(d.label))
                    ?.deviceId ?? null,
        };
    } catch {
        return { speakerId: null, earpieceId: null };
    }
}

export async function setOutput(
    audio: HTMLAudioElement | null,
    deviceId: string | null,
): Promise<boolean> {
    const el = audio as
        | (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
        | null;

    if (!el || typeof el.setSinkId !== 'function') {
        return false;
    }

    try {
        await el.setSinkId(deviceId ?? '');

        return true;
    } catch {
        return false;
    }
}
