import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageMappingDiagnosticsClient from "./page-mapping-diagnostics-client"
import ComprehensiveDiagnosticsClient from "./comprehensive-diagnostics-client"

export default function PageMappingDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Page Mapping Diagnostics</h1>

      <Tabs defaultValue="comprehensive" className="space-y-6">
        <TabsList>
          <TabsTrigger value="comprehensive">Comprehensive Diagnostics</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="comprehensive">
          <Suspense fallback={<div>Loading comprehensive diagnostics...</div>}>
            <ComprehensiveDiagnosticsClient />
          </Suspense>
        </TabsContent>

        <TabsContent value="manual">
          <Suspense fallback={<div>Loading manual diagnostics tool...</div>}>
            <PageMappingDiagnosticsClient />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
