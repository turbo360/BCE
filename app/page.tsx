import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthForms from "@/components/AuthForms";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="bg-bce-cream min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-bce-navy-dark to-bce-navy text-white py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">2026 Case Studies Portal</h1>
          <div className="w-24 h-1 bg-bce-gold mx-auto mb-4"></div>
          <p className="text-bce-light-blue text-lg font-semibold mb-1">
            BCE Professional Practices: Compliance Program
          </p>
          <p className="text-gray-400 text-sm">Modules 2 &ndash; 6</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Two column layout: Intro + Auth */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Introduction - takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-bce-navy-dark mb-4">Introduction</h2>
              <div className="space-y-4 text-bce-slate leading-relaxed text-[15px]">
                <p>
                  Participants in the BCE Professional Practices: Compliance Program are asked to review the following
                  case studies with their syndicate group members prior to the 2 day face to face component of the program.
                </p>
                <p className="text-sm italic text-gray-500">
                  Please note, there are no case studies provided for module 1.
                </p>
                <p>
                  During the 2 day program participants, in syndicates and on an individual basis, will be provided with
                  opportunities for sharing and debriefing the case studies with peers.
                </p>
                <p>
                  These case studies have been developed in consultation with BCE subject matter experts (SMEs). These
                  case studies have ground truth exemplifying incidents or are matters that have arisen within the
                  operating environment of BCE. Such case studies are for teaching purposes and the SMEs will provide an
                  overview of key issues and compliance matters material to each case study for future reference.
                </p>
                <p className="text-sm italic text-gray-500">
                  *NB External experts may also provide additional case studies and scenarios as part of the program.
                </p>
              </div>
            </div>
          </div>

          {/* Auth Forms - takes 2 columns */}
          <div className="lg:col-span-2">
            <AuthForms />
          </div>
        </div>
      </div>
    </div>
  );
}
