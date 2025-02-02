'use client';

import { useState, useEffect, useCallback } from 'react';
import { OpenAI } from 'openai';
import { toast } from 'react-hot-toast';
import useUser from '@/hooks/useUser';
import { updateUserScore } from '@/utils/db/actions';

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [quizEnded, setQuizEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [scoreUpdated, setScoreUpdated] = useState(false);

  const { user } = useUser();

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true,
      });

      const prompt = `Generate 10 very very super hard quiz questions in Thai language about proper waste management and knowledge about waste. Each question should have 4 options. Return the output as a JSON array, where each element is an object with the following structure:
{
  "question": "Question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 0
}
Please only output JSON.`;

      const messages = [{
        role: 'user' as const,
        content: prompt,
      }];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
      });

      const text = completion.choices[0].message?.content || '';
      // Extract JSON array from the response.
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Invalid JSON format received from OpenAI');
      }
      const jsonString = text.slice(jsonStart, jsonEnd);
      const generatedQuestions = JSON.parse(jsonString) as QuizQuestion[];
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      toast.error('Failed to generate quiz questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Global timer for the quiz.
  useEffect(() => {
    if (!quizStarted || quizEnded || loading) return;
    if (timeLeft <= 0) {
      endQuiz();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, quizEnded, loading, quizStarted]);

  const handleAnswer = (selectedIndex: number) => {
    if (quizEnded) return;
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = selectedIndex;
      return newAnswers;
    });
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setQuizEnded(true);
  };

  useEffect(() => {
    if (quizEnded && user && !scoreUpdated) {
      const correctCount = questions.reduce((count, question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
          return count + 1;
        }
        return count;
      }, 0);
      updateUserScore(user.id, correctCount * 10)
        .then(() => {
          setScoreUpdated(true);
        })
        .catch(err => {
          console.error('Error updating user score:', err);
        });
    }
  }, [quizEnded, user, scoreUpdated, questions, userAnswers]);

  const handlePlayAgain = () => {
    // Reset all states for a new quiz session.
    setQuizStarted(false);
    setQuizEnded(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeLeft(60);
    setScoreUpdated(false);
    loadQuestions();
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeLeft(60);
  };

  const correctCount = questions.reduce((count, question, index) => {
    if (userAnswers[index] === question.correctAnswer) {
      return count + 1;
    }
    return count;
  }, 0);

  // Main container with a beautiful gradient background.
  return (
    <div className="flex items-center justify-center">
      {!quizStarted ? (
        // Introductory rules screen.
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl p-8 text-center max-w-xl mt-2">
          <h1 className="text-3xl font-bold text-white mb-6">กฎกติกาเกม Quiz</h1>
          <ul className="text-lg text-white text-left mb-6 list-disc pl-5">
            <li>คุณจะมีเวลา 60 วินาทีในการตอบ 10 คำถามเกี่ยวกับการจัดการขยะ</li>
            <li>แต่ละคำถามมีตัวเลือก 4 ตัวเลือก</li>
            <li>คะแนนที่ได้รับ = จำนวนคำตอบที่ถูก × 10</li>
            <li>เมื่อเวลาหมดหรือคุณตอบครบ 10 คำถามแล้ว ระบบจะแสดงผลคะแนนและคำตอบที่ผิด</li>
          </ul>
          <button
            onClick={startQuiz}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition duration-300"
          >
            เริ่มเกม
          </button>
        </div>
      ) : loading ? (
        // Loading state.
          <div className="flex flex-col items-center justify-center mt-60">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">กำลังโหลดคำถาม...</p>
        </div>
      ) : quizEnded ? (
        // Quiz results summary.
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl p-2 text-white max-w-xl">
          <h1 className="text-3xl font-bold mb-4 text-center">สรุปผลคะแนน</h1>
          <p className="text-xl mb-2 text-center">คุณทำได้ {correctCount} ข้อจากทั้งหมด {questions.length} ข้อ</p>
          <p className="text-xl mb-6 text-center">ได้รับ {correctCount * 10} score</p>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">มาดูคำตอบที่ตอบผิดกัน</h2>
            <ul className="space-y-3 overflow-y-auto">
              {questions.map((question, index) => {
                if (userAnswers[index] !== question.correctAnswer) {
                  return (
                    <li key={index} className="p-4 bg-gray-700 bg-opacity-50 rounded">
                      <h3 className="font-bold">คำถามที่ {index + 1}</h3>
                      <p className="mb-1">{question.question}</p>
                      <p className="mb-1">คำตอบของคุณ: <span className="text-red-400">{typeof userAnswers[index] === 'number' ? question.options[userAnswers[index]] : "ไม่ได้ตอบ"}</span></p>
                      <p>คำตอบที่ถูก: <span className="text-green-400">{question.options[question.correctAnswer]}</span></p>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </div>
          <button
            onClick={handlePlayAgain}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition duration-300"
          >
            เล่นอีกครั้ง
          </button>
        </div>
      ) : (
        // Quiz question screen.
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-xl p-8 text-white max-w-xl w-full">
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>เหลือเวลา: {timeLeft} วินาที</span>
              <span>ข้อที่ {currentQuestionIndex + 1} จาก {questions.length}</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-4">{questions[currentQuestionIndex].question}</h1>
            <div className="space-y-4">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full py-3 px-4 bg-gray-800 rounded-lg shadow hover:bg-green-600 transition transform hover:scale-105"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}