<?php

namespace App\Leads\CallingApp;

use ZipArchive;

/**
 * Reads an APK's identity — package name, versionName, versionCode — from its
 * compiled AndroidManifest.xml (Android "binary XML": a string pool followed
 * by element chunks). Used so the calling app's published version always
 * comes from the file itself, never from a typed label (a mislabelled upload
 * once left every phone saying "Update available" forever).
 *
 * Deliberately minimal: only the <manifest> element's attributes are read.
 * Attributes are matched by their framework resource id (via the resource
 * map) or, failing that, by name, so shrunk/obfuscated builds work too.
 */
final class ApkManifestReader
{
    private const CHUNK_XML = 0x0003;

    private const CHUNK_STRING_POOL = 0x0001;

    private const CHUNK_RESOURCE_MAP = 0x0180;

    private const CHUNK_START_ELEMENT = 0x0102;

    private const UTF8_FLAG = 0x100;

    private const NO_INDEX = 0xFFFFFFFF;

    private const TYPE_STRING = 0x03;

    private const TYPE_INT_DEC = 0x10;

    private const TYPE_INT_HEX = 0x11;

    /** android:versionCode / android:versionName framework attribute ids. */
    private const ATTR_VERSION_CODE = 0x0101021B;

    private const ATTR_VERSION_NAME = 0x0101021C;

    /**
     * @return array{package: string|null, version_name: string|null, version_code: int|null}|null null when this isn't a readable APK
     */
    public static function fromApk(string $apkPath): ?array
    {
        $zip = new ZipArchive;

        if ($zip->open($apkPath, ZipArchive::RDONLY) !== true) {
            return null;
        }

        $manifest = $zip->getFromName('AndroidManifest.xml');
        $zip->close();

        return is_string($manifest) ? self::fromBinaryXml($manifest) : null;
    }

    /**
     * @return array{package: string|null, version_name: string|null, version_code: int|null}|null
     */
    public static function fromBinaryXml(string $xml): ?array
    {
        $length = strlen($xml);

        if ($length < 8 || self::u16($xml, 0) !== self::CHUNK_XML) {
            return null;
        }

        $strings = [];
        $resourceIds = [];
        $offset = self::u16($xml, 2);

        while ($offset + 8 <= $length) {
            $type = self::u16($xml, $offset);
            $headerSize = self::u16($xml, $offset + 2);
            $size = self::u32($xml, $offset + 4);

            if ($size < 8 || $offset + $size > $length) {
                return null;
            }

            if ($type === self::CHUNK_STRING_POOL) {
                $strings = self::stringPool($xml, $offset);
            } elseif ($type === self::CHUNK_RESOURCE_MAP) {
                for ($i = $offset + $headerSize; $i + 4 <= $offset + $size; $i += 4) {
                    $resourceIds[] = self::u32($xml, $i);
                }
            } elseif ($type === self::CHUNK_START_ELEMENT) {
                $ext = $offset + $headerSize;
                $name = $strings[self::u32($xml, $ext + 4)] ?? null;

                if ($name === 'manifest') {
                    return self::manifestAttributes($xml, $ext, $strings, $resourceIds);
                }
            }

            $offset += $size;
        }

        return null;
    }

    /**
     * @param  array<int, string>  $strings
     * @param  array<int, int>  $resourceIds
     * @return array{package: string|null, version_name: string|null, version_code: int|null}
     */
    private static function manifestAttributes(string $xml, int $ext, array $strings, array $resourceIds): array
    {
        $attributeStart = self::u16($xml, $ext + 8);
        $attributeSize = self::u16($xml, $ext + 10);
        $count = self::u16($xml, $ext + 12);

        $result = ['package' => null, 'version_name' => null, 'version_code' => null];

        for ($i = 0; $i < $count; $i++) {
            $at = $ext + $attributeStart + $i * $attributeSize;
            $nameIndex = self::u32($xml, $at + 4);
            $raw = self::u32($xml, $at + 8);
            $dataType = ord($xml[$at + 15]);
            $data = self::u32($xml, $at + 16);

            $name = $strings[$nameIndex] ?? '';
            $resourceId = $resourceIds[$nameIndex] ?? null;

            $stringValue = $raw !== self::NO_INDEX
                ? ($strings[$raw] ?? null)
                : ($dataType === self::TYPE_STRING ? ($strings[$data] ?? null) : null);

            if ($resourceId === self::ATTR_VERSION_CODE || $name === 'versionCode') {
                $result['version_code'] = in_array($dataType, [self::TYPE_INT_DEC, self::TYPE_INT_HEX], true)
                    ? $data
                    : (is_numeric($stringValue) ? (int) $stringValue : null);
            } elseif ($resourceId === self::ATTR_VERSION_NAME || $name === 'versionName') {
                $result['version_name'] = $stringValue;
            } elseif ($name === 'package') {
                $result['package'] = $stringValue;
            }
        }

        return $result;
    }

    /**
     * @return array<int, string>
     */
    private static function stringPool(string $xml, int $chunk): array
    {
        $count = self::u32($xml, $chunk + 8);
        $flags = self::u32($xml, $chunk + 16);
        $stringsStart = $chunk + self::u32($xml, $chunk + 20);
        $utf8 = ($flags & self::UTF8_FLAG) !== 0;
        $strings = [];

        for ($i = 0; $i < $count; $i++) {
            $at = $stringsStart + self::u32($xml, $chunk + 28 + $i * 4);
            $strings[$i] = $utf8 ? self::utf8String($xml, $at) : self::utf16String($xml, $at);
        }

        return $strings;
    }

    private static function utf8String(string $xml, int $at): string
    {
        // UTF-16 length (1–2 bytes), then UTF-8 byte length (1–2 bytes).
        $at += (ord($xml[$at]) & 0x80) !== 0 ? 2 : 1;
        $bytes = ord($xml[$at]);

        if (($bytes & 0x80) !== 0) {
            $bytes = (($bytes & 0x7F) << 8) | ord($xml[$at + 1]);
            $at += 2;
        } else {
            $at += 1;
        }

        return substr($xml, $at, $bytes);
    }

    private static function utf16String(string $xml, int $at): string
    {
        $chars = self::u16($xml, $at);

        if (($chars & 0x8000) !== 0) {
            $chars = (($chars & 0x7FFF) << 16) | self::u16($xml, $at + 2);
            $at += 4;
        } else {
            $at += 2;
        }

        return mb_convert_encoding(substr($xml, $at, $chars * 2), 'UTF-8', 'UTF-16LE');
    }

    private static function u16(string $xml, int $at): int
    {
        $value = unpack('v', $xml, $at);

        return is_array($value) ? (int) $value[1] : 0;
    }

    private static function u32(string $xml, int $at): int
    {
        $value = unpack('V', $xml, $at);

        return is_array($value) ? (int) $value[1] : 0;
    }
}
