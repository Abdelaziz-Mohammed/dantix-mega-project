import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <main>
        <Header
          pageName="Dashboard"
          sectionName="Model Monitoring & drift Detection"
        />
      </main>
    </ProtectedRoute>
  );
}
