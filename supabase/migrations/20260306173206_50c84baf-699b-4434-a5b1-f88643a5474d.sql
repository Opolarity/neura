-- Fix order 198: update payment amount from 20 to 30
UPDATE order_payment SET amount = 30 WHERE id = 182;
UPDATE movements SET amount = 30 WHERE id = 279;