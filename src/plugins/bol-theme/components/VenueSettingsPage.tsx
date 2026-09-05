import {
	Banner,
	Grid,
	GridItem,
	Input,
	InputArea,
	LayerCard,
	Loader,
	Select,
	Switch,
	Table,
	Text,
} from "@cloudflare/kumo";
import { EditorHeader, SaveButton } from "@emdash-cms/admin";
import { useEffect, useRef, useState } from "react";
import { WEEKDAY_LABELS } from "../constants.ts";
import { formatPhoneDisplay } from "../utils/phone.ts";
import type { OpeningHoursRow, VenueSettings } from "../utils/venue.ts";
import { getPluginRoute, postPluginRoute } from "./plugin-api.ts";

function settingsEqual(a: VenueSettings, b: VenueSettings): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function VenueSettingsPage() {
	const [settings, setSettings] = useState<VenueSettings | null>(null);
	const initialSettings = useRef<VenueSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		getPluginRoute<VenueSettings>("venue/settings")
			.then((data) => {
				if (!cancelled) {
					setSettings(data);
					initialSettings.current = data;
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : "Failed to load venue settings",
					);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const isDirty =
		settings !== null &&
		initialSettings.current !== null &&
		!settingsEqual(settings, initialSettings.current);

	const patch = (partial: Partial<VenueSettings>) => {
		setSettings((current) => (current ? { ...current, ...partial } : current));
		setSaved(false);
	};

	const updateHourRow = (index: number, patch: Partial<OpeningHoursRow>) => {
		setSettings((current) => {
			if (!current) return current;
			return {
				...current,
				openingHours: current.openingHours.map((row, i) =>
					i === index ? { ...row, ...patch } : row,
				),
			};
		});
		setSaved(false);
	};

	const handleSave = async () => {
		if (!settings) return;
		setSaving(true);
		setError(null);
		setSaved(false);
		try {
			await postPluginRoute("venue/settings", settings);
			initialSettings.current = settings;
			setSaved(true);
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : "Failed to save venue settings",
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading || !settings) return <Loader />;

	return (
		<div className="flex flex-col gap-6">
			<EditorHeader
				actions={
					<SaveButton
						isDirty={isDirty}
						isSaving={saving}
						onClick={handleSave}
						disabled={!isDirty || saving}
					/>
				}
			>
				<h1 className="truncate text-2xl font-semibold text-kumo-default">
					Venue settings
				</h1>
			</EditorHeader>

			<Text variant="secondary">
				Contact details, map links, socials, SEO, and opening hours for Bar of
				Legends.
			</Text>

			{error ? (
				<Banner variant="error" title="Could not save" description={error} />
			) : null}
			{saved ? (
				<Banner
					variant="default"
					title="Saved"
					description="Venue settings updated."
				/>
			) : null}

			<LayerCard>
				<LayerCard.Secondary>Contact</LayerCard.Secondary>
				<LayerCard.Primary className="flex flex-col gap-4">
					<Input
						label="Phone"
						description={
							settings.phone
								? `Shown on site as ${formatPhoneDisplay(settings.phone)}`
								: "International (+…) or local number — region from prefix, else Hungary (HU)"
						}
						value={settings.phone}
						onChange={(e) => patch({ phone: e.target.value })}
					/>
					<Input
						label="Email"
						type="email"
						value={settings.email}
						onChange={(e) => patch({ email: e.target.value })}
					/>
				</LayerCard.Primary>
			</LayerCard>

			<LayerCard>
				<LayerCard.Secondary>Location</LayerCard.Secondary>
				<LayerCard.Primary className="flex flex-col gap-4">
					<InputArea
						label="Address"
						value={settings.address}
						onChange={(e) => patch({ address: e.target.value })}
						rows={2}
					/>
					<Grid variant="2up" gap="sm">
						<GridItem>
							<Input
								label="Latitude"
								type="number"
								step="any"
								value={String(settings.lat)}
								onChange={(e) => patch({ lat: Number(e.target.value) })}
							/>
						</GridItem>
						<GridItem>
							<Input
								label="Longitude"
								type="number"
								step="any"
								value={String(settings.lng)}
								onChange={(e) => patch({ lng: Number(e.target.value) })}
							/>
						</GridItem>
					</Grid>
				</LayerCard.Primary>
			</LayerCard>

			<LayerCard>
				<LayerCard.Secondary>Social</LayerCard.Secondary>
				<LayerCard.Primary className="flex flex-col gap-4">
					<Input
						label="Instagram URL"
						value={settings.socialInstagram}
						onChange={(e) => patch({ socialInstagram: e.target.value })}
					/>
					<Input
						label="Facebook URL"
						value={settings.socialFacebook}
						onChange={(e) => patch({ socialFacebook: e.target.value })}
					/>
					<Input
						label="TikTok URL"
						value={settings.socialTiktok}
						onChange={(e) => patch({ socialTiktok: e.target.value })}
					/>
				</LayerCard.Primary>
			</LayerCard>

			<LayerCard>
				<LayerCard.Secondary>SEO</LayerCard.Secondary>
				<LayerCard.Primary className="flex flex-col gap-4">
					<Select
						label="Schema.org type"
						value={settings.schemaType}
						onValueChange={(value) =>
							patch({
								schemaType: value === "Restaurant" ? "Restaurant" : "BarOrPub",
							})
						}
					>
						<Select.Option value="BarOrPub">Bar or pub</Select.Option>
						<Select.Option value="Restaurant">Restaurant</Select.Option>
					</Select>
					<Input
						label="Price range"
						description="Optional, e.g. $$"
						value={settings.priceRange ?? ""}
						onChange={(e) => patch({ priceRange: e.target.value || undefined })}
					/>
				</LayerCard.Primary>
			</LayerCard>

			<LayerCard>
				<LayerCard.Secondary>Opening hours</LayerCard.Secondary>
				<LayerCard.Primary className="flex flex-col gap-4">
					<Text variant="secondary">
						Monday first. Use 24-hour HH:MM (e.g. 14:00, 24:00, 01:00 for
						after-midnight close). Turn off a day when the venue is closed.
					</Text>
					<div className="overflow-x-auto">
						<Table layout="fixed">
							<Table.Header>
								<Table.Row>
									<Table.Head>Day</Table.Head>
									<Table.Head>Open</Table.Head>
									<Table.Head>Opens</Table.Head>
									<Table.Head>Closes</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{settings.openingHours.map((row, index) => {
									const isClosed = row.closed === true;

									return (
										<Table.Row key={WEEKDAY_LABELS[index]}>
											<Table.Cell className="font-medium">
												{WEEKDAY_LABELS[index]}
											</Table.Cell>
											<Table.Cell>
												<Switch
													checked={!isClosed}
													onCheckedChange={(open) =>
														updateHourRow(index, { closed: !open })
													}
													aria-label={`${WEEKDAY_LABELS[index]} open`}
													size="sm"
												/>
											</Table.Cell>
											<Table.Cell>
												{isClosed ? (
													<Text variant="secondary">Closed</Text>
												) : (
													<Input
														value={row.open}
														onChange={(e) =>
															updateHourRow(index, { open: e.target.value })
														}
														placeholder="14:00"
														aria-label={`${WEEKDAY_LABELS[index]} opens`}
														size="sm"
													/>
												)}
											</Table.Cell>
											<Table.Cell>
												{isClosed ? (
													<Text variant="secondary">—</Text>
												) : (
													<Input
														value={row.close}
														onChange={(e) =>
															updateHourRow(index, { close: e.target.value })
														}
														placeholder="23:00"
														aria-label={`${WEEKDAY_LABELS[index]} closes`}
														size="sm"
													/>
												)}
											</Table.Cell>
										</Table.Row>
									);
								})}
							</Table.Body>
						</Table>
					</div>
				</LayerCard.Primary>
			</LayerCard>
		</div>
	);
}
