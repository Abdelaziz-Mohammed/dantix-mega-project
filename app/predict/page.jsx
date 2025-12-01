import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";

export default function PredictPage() {
  return (
    <ProtectedRoute>
      <main>
        <Header pageName="Dashboard" sectionName="Predict" />
      </main>
    </ProtectedRoute>
  );
}
