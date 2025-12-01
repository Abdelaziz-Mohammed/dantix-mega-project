import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <main>
        <Header pageName="Dashboard" sectionName="Upload Dataset" />
      </main>
    </ProtectedRoute>
  );
}
