/* ------------------ Imports ----------------- */
use scrypto::prelude::*;
use scrypto_avltree::{AvlTree, NodeIterator, NodeIteratorMut};

/* ------------- Custom Structures ------------ */
/// State explosion-safe vector; builds on Ociswap's AvlTree library
#[derive(ScryptoSbor)]
pub struct LazyVec<T: ScryptoSbor + Clone + Debug + PartialEq> {
    pub inner: AvlTree<Decimal, T>,
}

impl<T: ScryptoSbor + Clone + Debug + PartialEq> LazyVec<T> {
    /// Create an empty LazyVec instance
    pub fn new() -> Self {
        LazyVec { inner: AvlTree::new() }
    }

    pub fn length(&self) -> Decimal {
        Decimal::from(self.inner.get_length())
    }

    /// Add an element to the end of the vector, returns the index of the element
    pub fn append(&mut self, el: T) -> Decimal {
        info!("-------- lazyvec:append --------");
        info!("el={:?}", el);
        info!("cur-len={:?}, {:?}", self.length().to_string(), self.inner.get_length().to_string());
        self.inner.insert(self.length(), el);
        info!("cur-len={:?}, {:?}\n", self.length().to_string(), self.inner.get_length().to_string());
        info!("-/-/-/-/ lazyvec:append -/-/-/-/");
        self.length() - 1
    }

    pub fn remove(&mut self, i: &Decimal) -> Option<T> {
        self.inner.remove(i)
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

    /// Searches for the first occurence of T, and returns its index if found
    pub fn find(&self, flag: &T) -> Option<Decimal> {
        info!("-------- lazyvec:find --------");
        info!("flag = {:?}", flag);
        info!("els = {:#?}", self.inner.get_length());
        info!("els = {:#?}", self.length().to_string());
        info!("el0 = {:#?}", *self.inner.get(&dec!(0)).unwrap());
        for (i, el, _) in self.inner.range(dec!(0)..dec!(3)) {
            info!("el, i = {:?}, {:?}", el, i);
            info!("{:?}", &el == flag);
            if &el == flag {
                return Some(i);
            }
        }
        info!("-/-/-/-/ lazyvec:find -/-/-/-/");

        None
    }

    pub fn iter(&self) -> NodeIterator<Decimal, T> {
        self.inner.range(dec!(0)..self.length())
    }

    pub fn iter_mut(&mut self) -> NodeIteratorMut<Decimal, T> {
        self.inner.range_mut(dec!(0)..self.length())
    }
}
