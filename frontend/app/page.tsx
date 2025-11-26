import { BackgroundBeams } from "@/components/ui/background-beams";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { ChatInput } from "@/components/ui/chat-input";

export default function Home() {
  return (
    <div className="min-h-screen w-full rounded-md bg-neutral-950 relative flex flex-col antialiased">
      <NavbarWrapper />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="max-w-4xl mx-auto p-4 flex flex-col items-center gap-8">
          <h1 className="relative z-10 text-3xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-400 text-center font-sans font-bold">
            AI-Powered Email Assistant
          </h1>
          <div className="relative z-10 text-center space-y-2">
            <p className="text-neutral-300 text-xl md:text-2xl max-w-2xl mx-auto">
              Chat with AI to read, summarize, and send emails seamlessly.
            </p>
            <p className="text-neutral-400 text-xl md:text-2xl max-w-2xl mx-auto">
              Your intelligent Gmail companion powered by advanced AI.
            </p>
          </div>
        </div>
        <div className="w-full mt-12">
          <ChatInput />
        </div>
        <BackgroundBeams />
      </div>
    </div>
  );
}
