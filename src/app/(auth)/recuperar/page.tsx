import { RecuperarForm } from "./RecuperarForm";

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <RecuperarForm tokenInicial={token} />;
}
