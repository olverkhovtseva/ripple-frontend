import OrganizerProjectPage from "@/components/cabinet/OrganizerProjectPage";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <OrganizerProjectPage projectId={id} />;
}
