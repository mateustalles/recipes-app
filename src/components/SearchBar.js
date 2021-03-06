import React, { useEffect, useContext } from 'react';
import { withRouter } from 'react-router-dom';

import PropTypes from 'prop-types';
import { RecipesAppContext } from '../context/RecipesAppContext';
import {
  searchMealByName,
  searchAllMealsByFirstLetter,
  searchMealsByMainIngredient,
  searchDrinkByName,
  searchAllDrinksByFirstLetter,
  searchDrinksByMainIngredient,
} from '../services/searchBarApi';
import useDebounce from '../hooks/useDebounce';
import '../styles/SearchBar.css';

const fetchRecipes = (recipeType, searchString, searchType) => {
  const newValue = searchString.split(' ').join('_').toLowerCase();
  if (recipeType === 'Comidas') {
    switch (searchType) {
      case 'name':
        return searchMealByName(searchString);
      case 'ingredient':
        return searchMealsByMainIngredient(newValue);
      default:
        return searchAllMealsByFirstLetter(searchString);
    }
  }
  switch (searchType) {
    case 'name':
      return searchDrinkByName(searchString);
    case 'ingredient':
      return searchDrinksByMainIngredient(newValue);
    default:
      return searchAllDrinksByFirstLetter(searchString);
  }
};

const renderInputText = (inputValue, setInputValue) => (
  <input
    className="search-input"
    type="text"
    data-testid="search-input"
    value={inputValue.text}
    onChange={({ target: { value } }) => setInputValue((prevState) => ({
      ...prevState,
      text: value,
      didFetch: false,
    }))}
  />
);

const renderRadioButton = (radioValue, type, setInputValue, inputValue) => (
  <label htmlFor={type}>
    <input
      data-testid={`${type}-search-radio`}
      type="radio"
      id={type}
      defaultChecked={inputValue ? inputValue.radio === type : false}
      name="search"
      value={type}
      onClick={({ target: { value } }) => setInputValue((prevState) => ({
        ...prevState,
        radio: value,
        didFetch: false,
      }))}
    />
    {radioValue}
  </label>
);

const redirectMealRecipes = (mealRecipes, history, setRecipes) => {
  if (!mealRecipes || mealRecipes === null || mealRecipes === undefined) {
    setRecipes([]);
    return alert('Não foi encontrado nenhum resultado de comida.');
  }
  if (mealRecipes && mealRecipes.length === 1) return history.push(`/receitas/comida/${mealRecipes[0].idMeal}`);
  if (history.location.pathname === '/comidas') return setRecipes(mealRecipes);
  setRecipes(mealRecipes);
  return history.push('/comidas');
};

const redirectDrinkRecipes = (drinkRecipes, history, setRecipes) => {
  if (!drinkRecipes || drinkRecipes === null || drinkRecipes === undefined) {
    setRecipes([]);
    return alert('Não foi encontrado nenhum resultado de bebida.');
  }
  if (drinkRecipes && drinkRecipes.length === 1) return history.push(`/receitas/bebida/${drinkRecipes[0].idDrink}`);
  if (history.location.pathname === '/bebidas') return setRecipes(drinkRecipes);
  setRecipes(drinkRecipes);
  return history.push('/bebidas');
};

const RenderInputItems = ({ inputValue, setInputValue }) => (
  <div>
    <div className="search-bar-container">
      <div>
        {renderInputText(inputValue, setInputValue)}
      </div>
      <div className="input-radio-container">
        {renderRadioButton('Ingrediente', 'ingredient', setInputValue)}
        {renderRadioButton('Nome', 'name', setInputValue)}
        {renderRadioButton('Primeira Letra', 'first-letter', setInputValue, inputValue)}
      </div>
    </div>
  </div>
);

const SearchBar = ({ history, recipeType }) => {
  const {
    data: [, setRecipes],
    loading: [, setIsLoading],
    isSearching: [, setIsSearching],
    inputValue: [inputValue, setInputValue],
  } = useContext(RecipesAppContext);

  const {
    text, radio, didFetch,
  } = useDebounce(inputValue.text, inputValue.radio, inputValue.didFetch, 600);

  if ((text === '' || radio === '') && !didFetch) {
    setIsSearching(false);
  }

  useEffect(() => {
    const callApi = async () => {
      if (text.length > 1 && radio === 'first-letter') return alert('Sua busca deve conter somente 1 (um) caracter');
      setInputValue((prevState) => ({ ...prevState, didFetch: true }));
      setIsLoading(true);
      setIsSearching(true);
      return fetchRecipes(recipeType, text, radio)
        .then((recipe) => {
          setIsLoading(false);
          if ('meals' in recipe) return redirectMealRecipes(recipe.meals, history, setRecipes);
          return redirectDrinkRecipes(recipe.drinks, history, setRecipes);
        },
        () => {
          setRecipes([]);
          setIsLoading(false);
          return alert(`Não foi encontrado nenhum resultado de ${recipeType.toLowerCase()}.`);
        })
        .then(() => setInputValue(((prevState) => ({ ...prevState, didFetch: false }))));
    };
    if (text && radio && !didFetch) callApi();
  }, [
    text, radio, setIsLoading, setIsSearching, setRecipes,
    recipeType, setInputValue, didFetch, history]);

  return <RenderInputItems inputValue={inputValue} setInputValue={setInputValue} />;
};

export default withRouter(SearchBar);

RenderInputItems.propTypes = {
  inputValue: PropTypes.shape({
    text: PropTypes.string.isRequired,
    radio: PropTypes.string.isRequired,
    didFetch: PropTypes.bool.isRequired,
  }).isRequired,
  setInputValue: PropTypes.func.isRequired,
};

SearchBar.propTypes = {
  recipeType: PropTypes.string.isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
