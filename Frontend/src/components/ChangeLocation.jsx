// components/CountrySelector.jsx
import React, { useEffect, useState, useMemo, useContext } from 'react';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { CurrencyContext } from '../pages/CurrencyContext';

const CountrySelector = () => {
  const { setCurrency, setCountry } = useContext(CurrencyContext);

  const options = useMemo(() => {
    return countryList().getData().map((country) => ({
      label: country.label,
      value: country.value,
      flag: `https://flagcdn.com/w40/${country.value.toLowerCase()}.png`,
    }));
  }, []);

  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('userCountry');
    if (stored) {
      const found = options.find(opt => opt.value === stored);
      if (found) {
        setSelectedCountry(found);
        updateCurrencyContext(found.value);
      }
    }
  }, [options]);

  const updateCurrencyContext = (countryCode) => {
    if (countryCode === 'NG') {
      setCurrency('NGN');
    } else {
      setCurrency('USD');
    }
    setCountry(countryCode);
  };

  const handleChange = (selected) => {
    setSelectedCountry(selected);
    updateCurrencyContext(selected.value);
    localStorage.setItem('userCountry', selected.value);
  };

  const customSingleValue = ({ data }) => (
    <div className="flex items-center gap-2">
      <img
        src={data.flag}
        alt={data.label}
        className="w-5 h-4 rounded-sm object-cover"
      />
      <span className="text-sm">{data.label}</span>
    </div>
  );

  const customOption = (props) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <img
          src={data.flag}
          alt={data.label}
          className="w-5 h-4 rounded-sm object-cover"
        />
        <span className="text-sm">{data.label}</span>
      </div>
    );
  };

  return (
    <div className="w-64">
      <Select
        options={options}
        value={selectedCountry}
        onChange={handleChange}
        components={{ SingleValue: customSingleValue, Option: customOption }}
        placeholder="Change Location"
        isSearchable
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            padding: '0.25rem 0.5rem',
            borderColor: '#d1d5db',
            boxShadow: 'none',
            minHeight: '42px',
          }),
          menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            zIndex: 50,
          }),
        }}
      />
    </div>
  );
};

export default CountrySelector;
