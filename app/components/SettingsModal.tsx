"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/SettingsContext";
import { colorOptions } from "@/lib/colors";
import { Language } from "@/lib/translations";
import jsPDF from "jspdf";

// Define the type for message log entries
type MessageLogEntry = {
  text: string;
  timestamp: string;
  createdAt: Date;
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageLog: MessageLogEntry[];
}

export default function SettingsModal({ isOpen, onClose, messageLog }: SettingsModalProps) {
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, keywords, addKeyword, removeKeyword, audioInputDeviceId, setAudioInputDeviceId, t } = useSettings();
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

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

  const handleDownloadJson = () => {
    if (messageLog.length === 0) return;

    const dataStr = JSON.stringify(messageLog, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `intercom-logger-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDownloadPdf = () => {
    if (messageLog.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Intercom Logger - Message Log", margin, yPosition);
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Messages (newest first, as they appear in messageLog)
    doc.setFontSize(9);
    messageLog.forEach((entry, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }

      // Timestamp
      doc.setFont("helvetica", "bold");
      doc.text(`[${entry.timestamp}]`, margin, yPosition);
      yPosition += lineHeight;

      // Message text with word wrapping
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(entry.text, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Add spacing between messages
      yPosition += 3;
    });

    // Save the PDF
    doc.save(`intercom-logger-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
          </div>

          {/* Download Message Log */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("downloadMessageLog")}
            </label>
            
            {messageLog.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownloadJson}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                >
                  {t("downloadAsJson")}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                >
                  {t("downloadAsPdf")}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("noMessagesToDownload")}
              </p>
            )}
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>&copy; 2025: <a href="https://oskarijarvelin.fi" target="_blank" rel="noopener noreferrer" className="underline">Oskari Järvelin</a></p>
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
