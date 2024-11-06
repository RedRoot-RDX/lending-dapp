/* ------------------ Imports ----------------- */
use scrypto::prelude::*;
use scrypto_avltree::{AvlTree, NodeIterator, NodeIteratorMut};

/* ------------- Custom Structures ------------ */
/// State explosion-safe vector; builds on Ociswap's AvlTree library
pub struct LazyVec<T: ScryptoSbor + Clone + Debug + PartialEq> {
    inner: AvlTree<Decimal, T>,
}

impl<T: ScryptoSbor + Clone + Debug + PartialEq> LazyVec<T> {
    pub fn length(&self) -> Decimal {
        Decimal::from(self.inner.get_length())
    }

    /// Add an element to the end of the vector, returns the index of the element
    pub fn append(&mut self, el: T) -> Decimal {
        self.inner.insert(self.length(), el);
        self.length() - 1
    }

    /// Removes the first occurence of T, returns the index of the removed element
    pub fn pop(&mut self, flag: T) -> Option<Decimal> {
        let mut found: bool = false;
        let mut index: Decimal = Decimal::MIN;

        // Linearly search the AvlTree for the element
        for (i, el, _) in self.iter() {
            if el == flag {
                found = true;
                index = i;
                break;
            }
        }

        if !found {
            return None;
        }

        // Re-insert all the vec elements
        let mut pos: Decimal = dec!(-1);
        let mut updated_vec: AvlTree<Decimal, T> = AvlTree::new();
        for (i, el, _) in self.iter() {
            if i != index {
                pos = pos.checked_add(dec!(1)).expect("Unable to increment Decimal");
                updated_vec.insert(pos, el);
            }
        }

        self.inner = updated_vec;
        Some(index)
    }

    /// Identical to .pop() but with different logic (single for loop, no early exit), implementation being tested for speed
    pub fn pop_2(&mut self, flag: T) -> Option<Decimal> {
        let mut found: bool = false;
        let mut index: Decimal = Decimal::MIN;

        let mut pos: Decimal = dec!(-1);
        let mut updated_vec: AvlTree<Decimal, T> = AvlTree::new();

        // Linearly search the AvlTree for the element
        for (i, el, _) in self.iter() {
            if el == flag {
                found = true;
                index = i;
            } else {
                pos = pos.checked_add(dec!(1)).expect("Unable to increment Decimal");
                updated_vec.insert(pos, el);
            }
        }

        if !found {
            return None;
        }

        self.inner = updated_vec;
        Some(index)
    }

    pub fn iter(&self) -> NodeIterator<Decimal, T> {
        self.inner.range(dec!(0)..self.length())
    }

    pub fn iter_mut(&mut self) -> NodeIteratorMut<Decimal, T> {
        self.inner.range_mut(dec!(0)..self.length())
    }
}

#[derive(ScryptoSbor)]
pub enum FungibleValid {
    Full = 2,
    Untracked = 1,
    False = 0,
}
