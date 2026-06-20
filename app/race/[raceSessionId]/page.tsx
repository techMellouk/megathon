import RaceClient from "./RaceClient";

// Next 16: params and searchParams are async.
type Params = Promise<{ raceSessionId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RacePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { raceSessionId } = await params;
  const sp = await searchParams;
  const modelId = typeof sp.modelId === "string" ? sp.modelId : undefined;

  return <RaceClient raceSessionId={raceSessionId} modelId={modelId} />;
}
