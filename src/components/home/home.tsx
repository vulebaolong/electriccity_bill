"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Center, Divider, Group, NumberInput, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import ButtonToggleTheme from "../button/ButtonToggleTheme";

const TAX_RATE = 0.08;

const ELECTRIC_TIERS = [
    { label: "Bậc 1", price: 1984, limit: 50 },
    { label: "Bậc 2", price: 2050, limit: 50 },
    { label: "Bậc 3", price: 2380, limit: 100 },
    { label: "Bậc 4", price: 2998, limit: 100 },
    { label: "Bậc 5", price: 3350, limit: 100 },
    { label: "Bậc 6", price: 3460, limit: 0 }, // 0 = không giới hạn
] as const;

const formSchema = z
    .object({
        totalConsumption: z.number().min(0, "Tổng tiêu thụ phải >= 0"),
        totalBill: z.number().min(0, "Tổng số tiền phải >= 0"),
        sonConsumption: z.number().min(0, "Số tiêu thụ của Sơn phải >= 0"),
    })
    .superRefine((data, ctx) => {
        if (data.sonConsumption > data.totalConsumption) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["sonConsumption"],
                message: "Số tiêu thụ của Sơn không được lớn hơn tổng tiêu thụ",
            });
        }
    });

type FormValues = z.infer<typeof formSchema>;

type TierLine = {
    label: string;
    quantity: number;
    price: number;
    amount: number;
};

type PersonResult = {
    usage: number;
    subtotal: number;
    totalWithTax: number;
    lines: TierLine[];
};

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function safeNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundVnd(value: number) {
    return Math.round(value);
}

function calculatePersonBill(usage: number, startOffset: number): PersonResult {
    const start = Math.max(0, usage <= 0 ? 0 : startOffset);
    const end = start + Math.max(0, usage);

    let tierStart = 0;
    const lines: TierLine[] = [];

    for (const tier of ELECTRIC_TIERS) {
        const tierEnd = tier.limit === 0 ? Number.POSITIVE_INFINITY : tierStart + tier.limit;

        const overlapStart = Math.max(start, tierStart);
        const overlapEnd = Math.min(end, tierEnd);
        const quantity = Math.max(0, overlapEnd - overlapStart);

        if (quantity > 0) {
            lines.push({
                label: tier.label,
                quantity,
                price: tier.price,
                amount: quantity * tier.price,
            });
        }

        if (tier.limit !== 0) {
            tierStart += tier.limit;
        }
    }

    const subtotal = lines.reduce((sum, item) => sum + item.amount, 0);
    const totalWithTax = roundVnd(subtotal * (1 + TAX_RATE));

    return {
        usage: Math.max(0, usage),
        subtotal,
        totalWithTax,
        lines,
    };
}

function buildResult(values: Partial<FormValues>) {
    const totalConsumption = Math.max(0, safeNumber(values.totalConsumption));
    const totalBill = Math.max(0, safeNumber(values.totalBill));
    const sonConsumption = Math.min(Math.max(0, safeNumber(values.sonConsumption)), totalConsumption);

    const otherConsumption = Math.max(0, totalConsumption - sonConsumption);

    // Logic giống tờ giấy:
    // Người còn lại tính trước, Sơn tính sau
    const otherResult = calculatePersonBill(otherConsumption, 0);
    const sonResult = calculatePersonBill(sonConsumption, otherConsumption);

    const calculatedTotal = otherResult.totalWithTax + sonResult.totalWithTax;
    const diff = totalBill - calculatedTotal;

    return {
        totalConsumption,
        totalBill,
        sonConsumption,
        otherConsumption,
        otherResult,
        sonResult,
        calculatedTotal,
        diff,
    };
}

function ResultBlock({ title, usage, result }: { title: string; usage: number; result: PersonResult }) {
    return (
        <Paper withBorder radius="lg" p="md">
            <Stack gap={8}>
                <Group align="baseline">
                    <Text fw={800} fz={"h3"}>{title}:</Text>
                    <Text size="sm">{formatNumber(usage)} kWh</Text>
                </Group>

                {result.lines.length === 0 ? (
                    <Text c="dimmed">Chưa có dữ liệu</Text>
                ) : (
                    <Stack gap={4}>
                        {result.lines.map((line) => (
                            <Box key={line.label}>
                                <Group wrap="nowrap" align="baseline" justify="space-between" gap="md">
                                    <Group wrap="nowrap" gap="xs" style={{ flex: 1, minWidth: 0 }} align="baseline">
                                        {/* bậc */}
                                        <Text fw={700} fz={"md"} style={{ width: 50, flexShrink: 0 }}>
                                            {line.label}:
                                        </Text>

                                        {/* kWh đã dùng */}
                                        <Text fw={700} fz={"md"} ta="right" style={{ width: 26, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                                            {formatNumber(line.quantity)}
                                        </Text>

                                        <Text ta="center" style={{ width: 8, flexShrink: 0 }}>
                                            x
                                        </Text>

                                        <Text ta="right" style={{ width: 50, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                                            {formatNumber(line.price)}
                                        </Text>
                                    </Group>

                                    <Text
                                        fw={700}
                                        fz={"lg"}
                                        ta="right"
                                        style={{
                                            width: 120,
                                            flexShrink: 0,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {formatNumber(line.amount)}đ
                                    </Text>
                                </Group>
                            </Box>
                        ))}

                        <Divider my={4} />

                        <Group justify="space-between">
                            <Text size="sm">Cộng trước thuế</Text>
                            <Text fz={"lg"} fw={900}>
                                {formatNumber(result.subtotal)}đ
                            </Text>
                        </Group>

                        <Group justify="space-between">
                            <Text size="sm">Thuế 8%</Text>
                            <Text size="sm" fw={900}>
                                x 108%
                            </Text>
                        </Group>

                        <Group justify="space-between">
                            <Text fw={800}>Thành tiền</Text>
                            <Text fw={900} fz="h3">
                                {formatNumber(result.totalWithTax)}đ
                            </Text>
                        </Group>
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

export default function Home() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const init = useRef(false);

    const [savedValues, setSavedValues] = useLocalStorage<FormValues>({
        key: "electric-bill-form-values",
        defaultValue: {
            totalConsumption: 0,
            totalBill: 0,
            sonConsumption: 0,
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            totalConsumption: 0,
            totalBill: 0,
            sonConsumption: 0,
        },
    });

    const values = useWatch({
        control: form.control,
    });

    const result = useMemo(() => {
        if (init.current) {
            setSavedValues({
                totalConsumption: safeNumber(values.totalConsumption),
                totalBill: safeNumber(values.totalBill),
                sonConsumption: safeNumber(values.sonConsumption),
            });
        }

        return buildResult(values);
    }, [values]);

    useEffect(() => {
        if (mounted && !init.current) {
            form.reset({
                totalConsumption: safeNumber(savedValues.totalConsumption),
                totalBill: safeNumber(savedValues.totalBill),
                sonConsumption: safeNumber(savedValues.sonConsumption),
            });
            init.current = true;
        }
    }, [mounted, form, savedValues, init.current]);

    return (
        <Box
            maw={760}
            mx="auto"
            px="md"
            py="xl"
            style={{
                fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
        >
            <Stack gap="lg">
                <Stack gap={4}>
                    <Title order={1} fw={900}>Tính tiền điện</Title>
                    <Text c="dimmed">
                        Nhập 3 thông số, kết quả sẽ tự tính ngay.
                    </Text>
                </Stack>

                {/* <Paper withBorder radius="lg" p="md"> */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                        <Controller
                            control={form.control}
                            name="totalConsumption"
                            render={({ field, fieldState }) => (
                                <NumberInput
                                    label="Tổng tiêu thụ" //
                                    size="lg"
                                    fw={900}
                                    placeholder="Ví dụ: 306"
                                    suffix=" kWh"
                                    min={0}
                                    hideControls
                                    thousandSeparator=","
                                    value={field.value}
                                    onChange={(value) => field.onChange(safeNumber(value))}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="totalBill"
                            render={({ field, fieldState }) => (
                                <NumberInput
                                    label="Tổng số tiền bill" //
                                    size="lg"
                                    fw={900}
                                    placeholder="Ví dụ: 820368"
                                    suffix=" đ"
                                    min={0}
                                    hideControls
                                    thousandSeparator=","
                                    value={field.value}
                                    onChange={(value) => field.onChange(safeNumber(value))}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />

                        <Controller
                            control={form.control}
                            name="sonConsumption"
                            render={({ field, fieldState }) => (
                                <NumberInput
                                    label="Sơn dùng" //
                                    size="lg"
                                    fw={900}
                                    placeholder="Ví dụ: 208"
                                    suffix=" kWh"
                                    min={0}
                                    hideControls
                                    thousandSeparator=","
                                    value={field.value}
                                    onChange={(value) => field.onChange(safeNumber(value))}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />
                    </SimpleGrid>
                {/* </Paper> */}

                <Paper withBorder radius="lg" p="md">
                    <Stack gap={6}>
                        <Group justify="space-between">
                            <Text fz={"lg"}>Tổng tiêu thụ</Text>
                            <Text fw={700}>{formatNumber(result.totalConsumption)} kWh</Text>
                        </Group>

                        <Group justify="space-between">
                            <Text fz={"lg"}>Tổng số tiền hoá đơn</Text>
                            <Text fw={700}>{formatNumber(result.totalBill)}đ</Text>
                        </Group>
                    </Stack>
                </Paper>

                <Group w={"100%"}>
                    <Paper withBorder radius="lg" p="md" flex={1}>
                        <Stack>
                            <Text ta={"center"} fw={900}>
                                HẢI
                            </Text>
                            <Center>
                                <Group gap={5} align="baseline">
                                    <Text fw={900} fz={"h3"}>
                                        {formatNumber(result.otherConsumption)}
                                    </Text>
                                    <Text>kWh</Text>
                                </Group>
                            </Center>
                        </Stack>
                    </Paper>

                    <Paper withBorder radius="lg" p="md" flex={1}>
                        <Stack>
                            <Text ta={"center"} fw={900}>
                                SƠN
                            </Text>
                            <Center>
                                <Group gap={5} align="baseline">
                                    <Text fw={900} fz={"h3"}>
                                        {formatNumber(result.sonConsumption)}
                                    </Text>
                                    <Text>kWh</Text>
                                </Group>
                            </Center>
                        </Stack>
                    </Paper>
                </Group>

                <ResultBlock title="HẢI" usage={result.otherConsumption} result={result.otherResult} />

                <ResultBlock title="SƠN" usage={result.sonConsumption} result={result.sonResult} />

                <Paper withBorder radius="lg" p="md">
                    <Stack gap={8}>
                        <Group justify="space-between" align="baseline">
                            <Text fw={800}>HẢI trả</Text>
                            <Text fw={900} fz="h2">
                                {formatNumber(result.otherResult.totalWithTax)}đ
                            </Text>
                        </Group>

                        <Group justify="space-between" align="baseline">
                            <Text fw={800}>SƠN trả</Text>
                            <Text fw={900} fz="h2">
                                {formatNumber(result.sonResult.totalWithTax)}đ
                            </Text>
                        </Group>

                        <Divider />

                        <Group justify="space-between" align="baseline">
                            <Text fw={800}>Tổng cộng</Text>
                            <Text fw={900} fz={"h1"}>
                                {formatNumber(result.calculatedTotal)}đ
                            </Text>
                        </Group>
                    </Stack>
                </Paper>

                {result.totalBill > 0 && result.diff !== 0 && (
                    <Alert color={Math.abs(result.diff) < 5 ? "blue" : "yellow"} radius="md">
                        <Text size="sm">
                            Tổng tiền tính theo bậc thang là <b>{formatNumber(result.calculatedTotal)}đ</b>, lệch với bill nhập vào <b>{formatNumber(result.diff)}đ</b>.
                        </Text>
                    </Alert>
                )}

                <ButtonToggleTheme />
            </Stack>
        </Box>
    );
}
