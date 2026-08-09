import React, { useState } from 'react';
import { Shield, Eye, Lock, ArrowLeft, X } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function CamouflageCalc() {
  const { isCalculatorOpen, setIsCalculatorOpen, triggerSOS, isSOSActive } = useSafety();
  const { currentLocation } = useTrip();

  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [clearTapCount, setClearTapCount] = useState(0);
  const [secretAlertSent, setSecretAlertSent] = useState(false);

  if (!isCalculatorOpen) return null;

  const handleDigit = (digit) => {
    setDisplay(prev => {
      if (prev === "0" || prev === "Error") return String(digit);
      if (prev.length >= 9) return prev;
      return prev + digit;
    });
  };

  const handleDecimal = () => {
    setDisplay(prev => {
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  };

  const handleOp = (op) => {
    setPrevValue(parseFloat(display));
    setOperation(op);
    setDisplay("0");
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setClearTapCount(prev => prev + 1);
  };

  const handleEqual = () => {
    // Secret covert PIN trigger: 112=, 100=, 1091=, 911=
    if (["112", "112.0", "100", "100.0", "1091", "1091.0", "911", "911.0"].includes(display)) {
      triggerSOS("STEALTH_PIN_112", currentLocation);
      setSecretAlertSent(true);
      setDisplay("112.00");
      setTimeout(() => setSecretAlertSent(false), 3000);
      return;
    }

    if (operation && prevValue !== null) {
      const current = parseFloat(display);
      let res = 0;
      if (operation === "+") res = prevValue + current;
      if (operation === "-") res = prevValue - current;
      if (operation === "×") res = prevValue * current;
      if (operation === "÷") res = current !== 0 ? prevValue / current : "Error";

      setDisplay(String(Math.round(res * 10000) / 10000));
      setPrevValue(null);
      setOperation(null);
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const handleToggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(val * -1));
  };

  return (
    <div className="calculator-overlay">
      <div className="calc-phone-frame">
        {/* Top Subtle Disguise Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.75rem', marginBottom: '8px' }}>
          <button
            onClick={() => setIsCalculatorOpen(false)}
            style={{ background: 'none', border: 'none', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '4px' }}
            title="Exit Disguise Mode"
          >
            <ArrowLeft size={14} /> Exit Disguise
          </button>

          <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: secretAlertSent ? '#FF2A6D' : '#666' }}>
            {secretAlertSent ? '🛡️ SILENT SOS SENT' : 'CALCULATOR'}
          </span>

          <button
            onClick={() => setIsCalculatorOpen(false)}
            style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Calculator LCD Display */}
        <div className="calc-display">
          {display}
        </div>

        {/* Secret Trigger Hint */}
        <div style={{ fontSize: '10px', color: '#666', textAlign: 'right', marginBottom: '8px' }}>
          {isSOSActive ? '🔴 Covert Live SOS Active' : 'Enter 112= or 100= for silent SOS'}
        </div>

        {/* Keypad Grid */}
        <div className="calc-grid">
          <button className="calc-btn calc-btn-light" onClick={handleClear}>AC</button>
          <button className="calc-btn calc-btn-light" onClick={handleToggleSign}>±</button>
          <button className="calc-btn calc-btn-light" onClick={handlePercent}>%</button>
          <button className="calc-btn calc-btn-orange" onClick={() => handleOp("÷")}>÷</button>

          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(7)}>7</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(8)}>8</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(9)}>9</button>
          <button className="calc-btn calc-btn-orange" onClick={() => handleOp("×")}>×</button>

          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(4)}>4</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(5)}>5</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(6)}>6</button>
          <button className="calc-btn calc-btn-orange" onClick={() => handleOp("-")}>−</button>

          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(1)}>1</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(2)}>2</button>
          <button className="calc-btn calc-btn-dark" onClick={() => handleDigit(3)}>3</button>
          <button className="calc-btn calc-btn-orange" onClick={() => handleOp("+")}>+</button>

          <button className="calc-btn calc-btn-dark calc-btn-zero" onClick={() => handleDigit(0)}>0</button>
          <button className="calc-btn calc-btn-dark" onClick={handleDecimal}>.</button>
          <button className="calc-btn calc-btn-orange" onClick={handleEqual}>=</button>
        </div>
      </div>
    </div>
  );
}
