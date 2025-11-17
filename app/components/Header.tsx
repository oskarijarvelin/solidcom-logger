"use client";

import React from "react";
import { useSettings } from "@/lib/SettingsContext";

interface HeaderProps {
  isTranscribing: boolean;
  onToggleTranscription: () => void;
  onOpenSettings: () => void;
}

export default function Header({ isTranscribing, onToggleTranscription, onOpenSettings }: HeaderProps) {
  const { t } = useSettings();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          {t("appName")}
        </h1>
        
        <div className="flex items-center gap-4">
          {/* Recognition Toggle - ON/OFF with icons */}
          <button
            onClick={onToggleTranscription}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isTranscribing
                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
            }`}
            aria-label={isTranscribing ? "Turn OFF" : "Turn ON"}
          >
            {isTranscribing ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                <span className="font-semibold">ON</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                <span className="font-semibold">OFF</span>
              </>
            )}
          </button>

          {/* ElevenLabs Streaming Link */}
          <a
            href="/elevenlabs-streaming"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-500 hover:bg-purple-600 text-white shadow-lg transition-all"
            title="Try Eleven Labs Real-time Streaming"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold hidden sm:inline">EL Stream</span>
          </a>

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t("settings")}
          >
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
