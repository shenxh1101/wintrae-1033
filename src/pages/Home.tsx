import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import FeatureCards from '@/components/cards/FeatureCards';
import ChatContainer from '@/components/chat/ChatContainer';
import PlanModal from '@/components/modals/PlanModal';
import WrongBookModal from '@/components/modals/WrongBookModal';
import ProgressModal from '@/components/modals/ProgressModal';
import ReciteModal from '@/components/modals/ReciteModal';
import QuizModal from '@/components/modals/QuizModal';
import { useAppStore } from '@/store/useAppStore';
import { processUserMessage } from '@/engine/ChatEngine';

export default function Home() {
  const messages = useAppStore((s) => s.messages);
  const isTyping = useAppStore((s) => s.isTyping);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          <FeatureCards />
          <div className="flex-1 glass-panel flex flex-col overflow-hidden rounded-2xl shadow-card min-h-[500px]">
            <ChatContainer
              messages={messages}
              isTyping={isTyping}
              onSend={(text) => processUserMessage(text)}
            />
          </div>
        </div>
        <div className="hidden xl:block w-[340px] p-6 pl-0">
          <Sidebar />
        </div>
      </div>
      <PlanModal />
      <WrongBookModal />
      <ProgressModal />
      <ReciteModal />
      <QuizModal />
    </div>
  );
}
