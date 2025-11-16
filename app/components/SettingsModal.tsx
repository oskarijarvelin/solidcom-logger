"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/SettingsContext";
import { colorOptions } from "@/lib/colors";
import { Language } from "@/lib/translations";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, keywords, addKeyword, removeKeyword, audioInputDeviceId, setAudioInputDeviceId, t } = useSettings();
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeyword({
        keyword: newKeyword.trim(),
        color: selectedColor.value,
        textColor: selectedColor.textColor,
      });
      setNewKeyword("");
      setSelectedColor(colorOptions[0]);
    }
  };

  // Enumerate audio input devices when modal opens
  useEffect(() => {
    if (isOpen) {
      const enumerateDevices = async () => {
        try {
          // First, request microphone permission
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionGranted(true);
          
          // Then enumerate devices
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          setAudioDevices(audioInputs);
        } catch (error) {
          console.error('Error enumerating devices:', error);
          setPermissionGranted(false);
        }
      };
      
      enumerateDevices();
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t("settings")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("language")}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  language === "en"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("english")}
              </button>
              <button
                onClick={() => setLanguage("fi")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  language === "fi"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("finnish")}
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("theme")}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  theme === "light"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("light")}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  theme === "dark"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("dark")}
              </button>
            </div>
          </div>

          {/* Font Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("fontSize")}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFontSize("small")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  fontSize === "small"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("small")}
              </button>
              <button
                onClick={() => setFontSize("medium")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  fontSize === "medium"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("medium")}
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  fontSize === "large"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {t("large")}
              </button>
            </div>
          </div>

          {/* Audio Input Device Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("audioInputDevice")}
            </label>
            {permissionGranted && audioDevices.length > 0 ? (
              <select
                value={audioInputDeviceId}
                onChange={(e) => setAudioInputDeviceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("defaultDevice")}</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `${t("audioInputDevice")} ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("noDevicesFound")}
              </p>
            )}
          </div>

          {/* Keyword Highlighting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("keywordHighlighting")}
            </label>
            
            {/* Add New Keyword */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={t("keyword")}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
              />
              <select
                value={colorOptions.findIndex((c) => c.value === selectedColor.value)}
                onChange={(e) => setSelectedColor(colorOptions[parseInt(e.target.value)])}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {colorOptions.map((color, index) => (
                  <option key={index} value={index}>
                    {color.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                {t("addKeyword")}
              </button>
            </div>

            {/* Keywords List */}
            {keywords.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {keywords.map((kw, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: kw.color }}
                      ></div>
                      <span className="text-gray-900 dark:text-white">{kw.keyword}</span>
                    </div>
                    <button
                      onClick={() => removeKeyword(kw.keyword)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      {t("remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>&copy; 2025: <a href="https://oskarijarvelin.fi" target="_blank" rel="noopener noreferrer" className="underline">Oskari Järvelin</a></p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
