import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  Modal,
  ModalText,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  category: number;
  formattedPrice: string;
  extras: Extra[];
}

interface Data {
  product_id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const { id } = routeParams as Params;

      api.get(`foods/${id}`).then(response => {
        const foodResponse: Food = response.data;

        const formattedPrice = formatValue(foodResponse.price);

        const foodFormatted: Food = {
          ...foodResponse,
          formattedPrice,
        };

        const foodsExtras: Extra[] = foodResponse.extras;

        const foodsExtrasFormatted: Extra[] = foodsExtras.map(extra => {
          return {
            ...extra,
            quantity: 0,
          };
        });

        setFood(foodFormatted);
        setExtras(foodsExtrasFormatted);
      });
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const newExtras = extras.map(extra => {
      return {
        ...extra,
        quantity: extra.id === id ? extra.quantity + 1 : extra.quantity,
      };
    });

    setExtras(newExtras);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const newExtras = extras.map(extra => {
      return {
        ...extra,
        quantity:
          extra.id === id && extra.quantity > 0
            ? extra.quantity - 1
            : extra.quantity,
      };
    });

    setExtras(newExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    setIsFavorite(state => !state);

    api.post('favorites', {
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      image_url: food.image_url,
      thumbnail_url: food.thumbnail_url,
    });
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal

    const total = food.price * foodQuantity;

    let totalExtras = 0;

    extras.forEach(extra => {
      totalExtras += extra.quantity * extra.value;
    });

    const allTotal = total + totalExtras;

    const totalFormatted = formatValue(allTotal);

    return totalFormatted;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    setModalVisible(true);

    const data: Data = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.image_url,
      extras,
    };

    setTimeout(() => {
      navigation.goBack();
    }, 2000);

    await api.post('orders', data);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <>
      <Modal visible={modalVisible}>
        <Icon name="thumbs-up" size={40} color="#39b100" />
        <ModalText>Pedido confirmado!</ModalText>
      </Modal>
      <Container>
        <Header />
        <ScrollContainer>
          <FoodsContainer>
            <Food>
              <FoodImageContainer>
                <Image
                  style={{ width: 327, height: 183 }}
                  source={{
                    uri: food.image_url,
                  }}
                />
              </FoodImageContainer>
              <FoodContent>
                <FoodTitle>{food.name}</FoodTitle>
                <FoodDescription>{food.description}</FoodDescription>
                <FoodPricing>{food.formattedPrice}</FoodPricing>
              </FoodContent>
            </Food>
          </FoodsContainer>
          <AdditionalsContainer>
            <Title>Adicionais</Title>
            {extras.map(extra => (
              <AdittionalItem key={extra.id}>
                <AdittionalItemText>{extra.name}</AdittionalItemText>
                <AdittionalQuantity>
                  <Icon
                    size={15}
                    color="#6C6C80"
                    name="minus"
                    onPress={() => handleDecrementExtra(extra.id)}
                    testID={`decrement-extra-${extra.id}`}
                  />
                  <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                    {extra.quantity}
                  </AdittionalItemText>
                  <Icon
                    size={15}
                    color="#6C6C80"
                    name="plus"
                    onPress={() => handleIncrementExtra(extra.id)}
                    testID={`increment-extra-${extra.id}`}
                  />
                </AdittionalQuantity>
              </AdittionalItem>
            ))}
          </AdditionalsContainer>
          <TotalContainer>
            <Title>Total do pedido</Title>
            <PriceButtonContainer>
              <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
              <QuantityContainer>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={handleDecrementFood}
                  testID="decrement-food"
                />
                <AdittionalItemText testID="food-quantity">
                  {foodQuantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={handleIncrementFood}
                  testID="increment-food"
                />
              </QuantityContainer>
            </PriceButtonContainer>

            <FinishOrderButton onPress={() => handleFinishOrder()}>
              <ButtonText>Confirmar pedido</ButtonText>
              <IconContainer>
                <Icon name="check-square" size={24} color="#fff" />
              </IconContainer>
            </FinishOrderButton>
          </TotalContainer>
        </ScrollContainer>
      </Container>
    </>
  );
};

export default FoodDetails;
