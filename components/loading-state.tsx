import { Loader2 } from "lucide-react"

export default function LoadingState() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h3 className="text-lg font-medium">Loading time series data...</h3>
        <p className="text-sm text-muted-foreground">Please wait while we process your data</p>
      </div>
    </div>
  )
}
